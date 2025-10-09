import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommentForm } from '../../../shared/comments/comment-form/comment-form';
import { Dialog } from '@angular/cdk/dialog';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, MessageSquare, Plus } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, map, switchMap, catchError, of, tap } from 'rxjs';
import { User } from '@app/models';
import { PostsApiService } from './posts-api.service';
import type { Comment, PaginationMeta, Post } from '@app/models';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { UsersApiService } from '../users/services/users-api-service';
import { PostForm } from './post-form/post-form';

@Component({
  selector: 'app-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, ToastComponent, CommentForm],
  templateUrl: './posts.html',
  styleUrls: ['./posts.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Posts {
  private readonly postsApi = inject(PostsApiService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(Dialog);
  private readonly usersApi = inject(UsersApiService);

  readonly MessageSquare = MessageSquare;
  readonly Plus = Plus;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly posts = signal<Post[]>([]);
  readonly pagination = signal<PaginationMeta | null>(null);
  readonly commentsMap = signal<Record<number, Comment[]>>({});
  readonly commentsLoading = signal<Record<number, boolean>>({});
  readonly userOptions = signal<User[]>([]);
  readonly userLookup = signal<Record<number, string>>({});

  private readonly pageSignal = signal(1);
  private readonly perPageSignal = signal(10);
  private readonly filters = signal<{ title: string | null; userId: number | null }>({
    title: null,
    userId: null,
  });
  private readonly reloadToken = signal(0);

  readonly perPageOptions = [5, 10, 20];

  readonly queryCriteria = computed(() => ({
    page: this.pageSignal(),
    per_page: this.perPageSignal(),
    title: this.filters().title ?? undefined,
    user_id: this.filters().userId ?? undefined,
    reload: this.reloadToken(),
  }));

  readonly searchForm = this.fb.nonNullable.group({
    title: this.fb.nonNullable.control(''),
    userId: this.fb.nonNullable.control(0),
  });

  constructor() {
    this.loadUsersForFilter();
    this.setupSearchForm();
    this.setupPostsStream();
  }

  private setupSearchForm(): void {
    this.searchForm.controls.title.valueChanges
      .pipe(
        debounceTime(300),
        map((value) => value.trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.filters.update((f) => ({ ...f, title: value.length ? value : null }));
        this.setPage(1);
      });

    this.searchForm.controls.userId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        const userId = Number(value);
        this.filters.update((f) => ({ ...f, userId: userId > 0 ? userId : null }));
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
              this.error.set('Impossibile caricare i post');
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

  trackById(_idx: number, item: Post): number {
    return item.id;
  }

  authorsName(userId: number): string {
    return this.userLookup()[userId] ?? `Utente #${userId}`;
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
          this.toast.show('error', 'Impossibile caricare i commenti. Riprova.');
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

  hasPagination(): boolean {
    const meta = this.pagination();
    return meta ? meta.pages > 1 : false;
  }

  currentPage(): number {
    return this.pageSignal();
  }

  totalPages(): number {
    return this.pagination()?.pages ?? 1;
  }

  setPage(page: number): void {
    const total = this.totalPages();
    const nextPage = Math.max(1, Math.min(page, total));
    if (nextPage !== this.pageSignal()) {
      this.pageSignal.set(nextPage);
    }
  }

  changePerPage(perPage: number): void {
    const sanitized = Math.max(1, perPage);
    if (sanitized !== this.perPageSignal()) {
      this.perPageSignal.set(sanitized);
      this.setPage(1);
    }
  }

  refresh(): void {
    this.reloadToken.update((n) => n + 1);
  }

  openCreatePost(): void {
    const isMobile = window.innerWidth < 640;
    const baseConfig = isMobile
      ? {
          position: { right: '0', top: '0' },
          height: '100%',
          width: '480px',
          maxWidth: '100vw',
          panelClass: 'slide-in-drawer',
          backdropClass: 'blurred-backdrop',
          ariaLabel: 'Nuovo post',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        }
      : {
          width: '620px',
          maxWidth: '90vw',
          backdropClass: 'blurred-backdrop',
          panelClass: 'user-form-modal',
          ariaLabel: 'Nuovo post',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        };

    const ref = this.dialog.open(PostForm, {
      ...baseConfig,
      data: { users: this.userOptions() },
    });
    ref.closed.subscribe((result) => {
      if (result === 'success') {
        this.setPage(1);
        this.refresh();
      }
    });
  }

  resetFilters(): void {
    this.searchForm.reset({ title: '', userId: 0 });
    this.filters.set({ title: null, userId: null });
    this.setPage(1);
  }

  currentPerPage(): number {
    return this.perPageSignal();
  }
}
