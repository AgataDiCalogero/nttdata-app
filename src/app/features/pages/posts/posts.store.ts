import { Injectable, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, switchMap, tap, catchError, of } from 'rxjs';
import type { Comment, PaginationMeta, Post, User } from '@app/models';
import { PostsApiService } from '@app/services/posts/posts-api.service';
import { UsersApiService } from '@app/services/users/users-api.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

interface PostFilters {
  title: string | null;
  userId: number | null;
}

interface QueryCriteria {
  page: number;
  per_page: number;
  title?: string;
  user_id?: number;
  reload: number;
}

@Injectable()
export class PostsStore {
  private readonly postsApi = inject(PostsApiService);
  private readonly usersApi = inject(UsersApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly perPageOptions = [5, 10, 20];

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly posts = signal<Post[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly commentsMap = signal<Record<number, Comment[]>>({});
  readonly commentsLoading = signal<Record<number, boolean>>({});
  readonly userOptions = signal<User[]>([]);
  readonly userLookup = signal<Record<number, string>>({});
  readonly deletingId = signal<number | null>(null);

  private readonly filters = signal<PostFilters>({ title: null, userId: null });
  private readonly page = signal(1);
  private readonly perPage = signal(10);
  private readonly reloadToken = signal(0);

  readonly queryCriteria = computed<QueryCriteria>(() => ({
    page: this.page(),
    per_page: this.perPage(),
    title: this.filters().title ?? undefined,
    user_id: this.filters().userId ?? undefined,
    reload: this.reloadToken(),
  }));

  readonly searchForm = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control(''),
    userId: this.fb.nonNullable.control(0),
  });

  readonly hasPagination = computed(() => {
    const meta = this.pagination();
    return Boolean(meta && meta.pages > 1);
  });

  readonly currentPage = computed(() => this.pagination()?.page ?? this.page());
  readonly totalPages = computed(() => this.pagination()?.pages ?? 1);
  readonly currentPerPage = computed(() => this.pagination()?.limit ?? this.perPage());

  constructor() {
    this.setupSearchForm();
    this.loadUsersForFilter();
    this.setupPostsStream();
  }

  setTitleFilter(value: string): void {
    const title = value.trim();
    this.filters.update((state) => ({ ...state, title: title.length ? title : null }));
  }

  setUserFilter(userId: number): void {
    this.filters.update((state) => ({
      ...state,
      userId: userId > 0 ? userId : null,
    }));
  }

  resetFilters(): void {
    this.searchForm.reset({ title: '', userId: 0 });
    this.filters.set({ title: null, userId: null });
    this.setPage(1);
  }

  refresh(): void {
    this.reloadToken.update((token) => token + 1);
  }

  setPage(page: number): void {
    const totalPages = Math.max(this.totalPages(), 1);
    const next = Math.max(1, Math.min(page, totalPages));
    this.page.set(next);
  }

  changePerPage(perPage: number): void {
    const sanitized = Math.max(1, perPage);
    if (sanitized === this.perPage()) {
      return;
    }
    this.perPage.set(sanitized);
    this.setPage(1);
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap()[postId];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  toggleComments(postId: number): void {
    const loaded = this.commentsMap()[postId];
    if (loaded) {
      const copy = { ...this.commentsMap() };
      delete copy[postId];
      this.commentsMap.set(copy);
      return;
    }

    this.commentsLoading.update((state) => ({ ...state, [postId]: true }));
    this.postsApi
      .listComments(postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.commentsMap.update((state) => ({ ...state, [postId]: comments ?? [] }));
        },
        error: (err) => {
          console.error('Failed to load comments:', err);
          this.toast.show('error', 'Unable to load comments. Please retry.');
        },
        complete: () => {
          this.commentsLoading.update((state) => ({ ...state, [postId]: false }));
        },
      });
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentsMap.update((state) => {
      const current = state[postId] ?? [];
      return { ...state, [postId]: [comment, ...current] };
    });
  }

  initializePaging(page: number, perPage: number): void {
    const sanitizedPerPage = Math.max(1, perPage);
    const sanitizedPage = Math.max(1, page);
    const needsReload = sanitizedPerPage !== this.perPage() || sanitizedPage !== this.page();
    this.perPage.set(sanitizedPerPage);
    this.page.set(sanitizedPage);
    if (needsReload) {
      this.refresh();
    }
  }

  isDeleting(postId: number): boolean {
    return this.deletingId() === postId;
  }

  deletePost(post: Post): void {
    const shouldGoPrev =
      this.posts().length <= 1 && this.currentPage() > 1 && this.totalPages() > 1;

    this.deletingId.set(post.id);
    this.postsApi
      .delete(post.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.posts.update((list) => list.filter((item) => item.id !== post.id));
          this.pagination.update((meta) => {
            if (!meta) return meta;
            const total = Math.max(meta.total - 1, 0);
            const limit = meta.limit || this.perPage();
            const pages = Math.max(1, Math.ceil(total / (limit || 1)));
            return { ...meta, total, pages };
          });
          this.toast.show('success', 'Post deleted');
          if (shouldGoPrev) {
            this.setPage(this.currentPage() - 1);
          }
          this.refresh();
        },
        error: (err) => {
          console.error('Failed to delete post:', err);
          this.deletingId.set(null);
          this.toast.show('error', 'Unable to delete post. Please retry.');
        },
      });
  }

  private setupSearchForm(): void {
    this.searchForm.controls.title.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.setTitleFilter(value);
        this.setPage(1);
      });

    this.searchForm.controls.userId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.setUserFilter(Number(value));
        this.setPage(1);
      });
  }

  private setupPostsStream(): void {
    toObservable(this.queryCriteria)
      .pipe(
        map((criteria) => {
          const { reload, ...params } = criteria;
          void reload;
          return params;
        }),
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(null);
          return this.postsApi.list(params).pipe(
            tap((result) => {
              this.posts.set(result.data ?? []);
              this.pagination.set(result.pagination);
              this.loading.set(false);
            }),
            catchError((err) => {
              console.error('Failed to load posts:', err);
              this.error.set('Unable to load posts');
              this.loading.set(false);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private loadUsersForFilter(): void {
    this.usersApi
      .list({ per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          const list = users ?? [];
          this.userOptions.set(list);
          const lookup = list.reduce<Record<number, string>>((acc, user) => {
            acc[user.id] = user.name ?? `User #${user.id}`;
            return acc;
          }, {});
          this.userLookup.set(lookup);
        },
        error: (err) => {
          console.error('Failed to load users for filters:', err);
        },
      });
  }
}
