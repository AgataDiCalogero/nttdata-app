import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import type { User, Post, Comment } from '@/app/shared/models';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { CommentsCacheService } from '@/app/shared/services/comments-cache/comments-cache.service';
import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { ButtonComponent } from '@/app/shared/ui';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';
import { LoaderComponent } from '@/app/shared/ui/loader/loader.component';
import {
  LucideAngularModule,
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
} from 'lucide-angular';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    AlertComponent,
    LoaderComponent,
    PostCardComponent,
    LucideAngularModule,
    MatSlideToggleModule,
    MatCardModule,
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly usersApi = inject(UsersApiService);
  private readonly postsApi = inject(PostsApiService);
  private readonly commentsCache = inject(CommentsCacheService);
  private readonly notifications = inject(NotificationsService);
  private readonly pagination =
    inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
    DEFAULT_PAGINATION_CONFIG;

  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly postsLoading = signal(true);

  private readonly commentsMapSignal = signal<Record<number, Comment[]>>({});
  private readonly commentsLoadingSignal = signal<Record<number, boolean>>({});
  readonly commentsCount = signal<Record<number, number>>({});

  private readonly userId = this.resolveUserId();
  private readonly postsFetchLimit = Math.max(
    ...this.pagination.perPageOptions,
    this.pagination.defaultPerPage,
  );
  private readonly userSource: Signal<User | null>;

  readonly user = signal<User | null>(null);

  readonly posts: Signal<Post[]> =
    this.userId === null ? signal<Post[]>([]) : this.createPostsSignal();

  constructor() {
    if (this.userId === null) {
      this.userSource = signal<User | null>(null);
      this.user.set(null);
      this.error.set('Invalid user ID');
      this.loading.set(false);
      this.postsLoading.set(false);
      return;
    }

    this.userSource = this.createUserSignal();

    effect(() => {
      const value = this.userSource();
      this.user.set(value);
    });

    effect(() => {
      const posts = this.posts();
      if (!posts.length) {
        return;
      }
      void this.prefetchCommentCounts(posts);
    });
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMapSignal()[postId];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoadingSignal()[postId]);
  }

  async onToggleComments(postId: number): Promise<void> {
    const current = this.commentsMapSignal()[postId];
    if (current) {
      const next = { ...this.commentsMapSignal() };
      delete next[postId];
      this.commentsMapSignal.set(next);
      return;
    }

    this.commentsLoadingSignal.update((state) => ({ ...state, [postId]: true }));
    try {
      const comments = await firstValueFrom(this.commentsCache.fetchComments(postId));
      const list = comments ?? [];
      this.commentsMapSignal.update((state) => ({ ...state, [postId]: list }));
      this.commentsCount.update((state) => ({
        ...state,
        [postId]: Array.isArray(list) ? list.length : 0,
      }));
      this.commentsCache.setComments(postId, list);
    } catch (err) {
      console.error('Failed to load comments:', err);
      this.notifications.showHttpError(err, 'Unable to load comments');
    } finally {
      this.commentsLoadingSignal.update((state) => ({ ...state, [postId]: false }));
    }
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentsMapSignal.update((state) => {
      const current = state[postId] ?? [];
      return { ...state, [postId]: [comment, ...current] };
    });
    this.commentsCount.update((state) => ({
      ...state,
      [postId]: 1 + (state[postId] ?? this.commentsMapSignal()[postId]?.length ?? 0),
    }));
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentsMapSignal.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      return {
        ...state,
        [postId]: current.map((existing) => (existing.id === comment.id ? comment : existing)),
      };
    });
  }

  onCommentDeleted(postId: number, commentId: number): void {
    this.commentsMapSignal.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      return {
        ...state,
        [postId]: current.filter((existing) => existing.id !== commentId),
      };
    });
    this.commentsCount.update((state) => ({
      ...state,
      [postId]: Math.max(0, (state[postId] ?? this.commentsMapSignal()[postId]?.length ?? 1) - 1),
    }));
  }

  trackPostId(_idx: number, post: Post): number {
    return post.id;
  }

  onToggleStatus(checked: boolean): void {
    const nextStatus = checked ? 'active' : 'inactive';
    this.user.update((current) => (current ? { ...current, status: nextStatus } : current));
  }

  private resolveUserId(): number | null {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private createUserSignal(): Signal<User | null> {
    return toSignal(
      this.usersApi.getById(this.userId!).pipe(
        tap(() => {
          this.error.set(null);
          this.loading.set(false);
        }),
        catchError((err) => {
          console.error('Failed to load user:', err);
          const message = this.notifications.showHttpError(err, 'Unable to load user details');
          this.error.set(message);
          this.loading.set(false);
          return of(null);
        }),
      ),
      { initialValue: null },
    );
  }

  private createPostsSignal(): Signal<Post[]> {
    return toSignal(
      this.postsApi
        .list({ user_id: this.userId!, per_page: this.postsFetchLimit })
        .pipe(
          map((result) => result?.items ?? []),
          tap(() => {
            this.postsLoading.set(false);
          }),
          catchError((err) => {
            console.error('Failed to load posts for user:', err);
            this.notifications.showHttpError(err, 'Unable to load user posts');
            this.postsLoading.set(false);
            return of<Post[]>([]);
          }),
        ),
      { initialValue: [] },
    );
  }

  private async prefetchCommentCounts(posts: Post[]): Promise<void> {
    const known = this.commentsCount();
    const pending = posts.filter((post) => known[post.id] === undefined);
    if (!pending.length) {
      return;
    }

    await Promise.all(
      pending.map(async (post) => {
        try {
          const count = await firstValueFrom(this.commentsCache.fetchCommentCount(post.id));
          this.commentsCount.update((state) => ({ ...state, [post.id]: count }));
        } catch (err) {
          console.error('Failed to load comment count:', err);
        }
      }),
    );
  }
}
