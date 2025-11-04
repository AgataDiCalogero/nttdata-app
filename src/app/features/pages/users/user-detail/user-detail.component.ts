import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, firstValueFrom, map, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { User } from '@/app/shared/models/user';
import type { Post, Comment } from '@/app/shared/models/post';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { CommentsCacheService } from '@/app/shared/services/comments-cache/comments-cache.service';
import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { MatCardModule } from '@angular/material/card';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';
import { LoaderComponent } from '@/app/shared/ui/loader/loader.component';
import { StatusBadgeComponent } from '@app/shared/ui/status-badge/status-badge.component';
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
    MatCardModule,
    StatusBadgeComponent,
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
  private readonly destroyRef = inject(DestroyRef);
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

  commentsFor(postId: number): Comment[] {
    return this.commentsMapSignal()[postId] ?? [];
  }

  commentsLoaded(postId: number): boolean {
    return Object.prototype.hasOwnProperty.call(this.commentsMapSignal(), postId);
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
        [postId]: list.length,
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
    let nextLength = 1;
    let nextComments: Comment[] = [];
    this.commentsMapSignal.update((state) => {
      const current = state[postId] ?? [];
      const next = [comment, ...current];
      nextLength = next.length;
      nextComments = next;
      return { ...state, [postId]: next };
    });
    this.commentsCount.update((state) => ({
      ...state,
      [postId]: nextLength,
    }));
    this.commentsCache.setComments(postId, nextComments);
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentsMapSignal.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      const updated = current.map((existing) => (existing.id === comment.id ? comment : existing));
      this.commentsCache.setComments(postId, updated);
      return {
        ...state,
        [postId]: updated,
      };
    });
  }

  onCommentDeleted(postId: number, commentId: number): void {
    let nextLength = 0;
    let nextComments: Comment[] | undefined;
    this.commentsMapSignal.update((state) => {
      const current = state[postId];
      if (!current) {
        return state;
      }
      const filtered = current.filter((existing) => existing.id !== commentId);
      nextLength = filtered.length;
      nextComments = filtered;
      return {
        ...state,
        [postId]: filtered,
      };
    });
    this.commentsCount.update((state) => ({
      ...state,
      [postId]: nextLength,
    }));
    this.commentsCache.setComments(postId, nextComments ?? []);
  }

  trackPostId(_idx: number, post: Post): number {
    return post.id;
  }

  onStatusChange(status: 'active' | 'inactive'): void {
    const currentUser = this.user();
    if (!currentUser || !this.userId) {
      return;
    }

    // Optimistically update the UI
    this.user.update((current) => (current ? { ...current, status } : current));

    // Make the API call
    this.usersApi
      .update(this.userId, { status })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedUser: User) => {
          // Update with the server response
          this.user.set(updatedUser);
        },
        error: (err) => {
          console.error('Failed to update user status:', err);
          this.notifications.showHttpError(err, 'Unable to update user status');
          // Revert the optimistic update
          this.user.update((current) =>
            current ? { ...current, status: currentUser.status } : current,
          );
        },
      });
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
      this.postsApi.list({ userId: this.userId!, perPage: this.postsFetchLimit }).pipe(
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
