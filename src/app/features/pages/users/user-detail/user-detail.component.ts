import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import type { User, Post, Comment } from '@/app/shared/models';
import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { ButtonComponent, StatusBadgeComponent } from '@/app/shared/ui';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';
import { LoaderComponent } from '@/app/shared/ui/loader/loader.component';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { from, mergeMap, of, catchError, map } from 'rxjs';
import {
  LucideAngularModule,
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
} from 'lucide-angular';

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
  private readonly toast = inject(ToastService);

  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly posts = signal<Post[]>([]);
  readonly postsLoading = signal(true);

  private readonly commentsMap = signal<Record<number, Comment[]>>({});
  private readonly commentsLoading = signal<Record<number, boolean>>({});
  readonly commentsCount = signal<Record<number, number>>({});

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    if (!id) {
      this.error.set('Invalid user ID');
      this.loading.set(false);
      return;
    }

    this.loadUser(id);
    this.loadUserPosts(id);
  }

  private loadUser(id: number): void {
    this.usersApi
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (u) => this.user.set(u),
        error: (err) => {
          console.error('Failed to load user:', err);
          this.toast.show('error', 'Unable to load user details');
          this.error.set('Unable to load user details');
          this.loading.set(false);
        },
        complete: () => this.loading.set(false),
      });
  }

  private loadUserPosts(userId: number): void {
    this.postsLoading.set(true);
    this.postsApi
      .list({ user_id: userId, per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ items }) => {
          const list = items ?? [];
          this.posts.set(list);
          const known = this.commentsCount();
          const toFetch = list.filter((p) => known[p.id] === undefined);
          from(toFetch)
            .pipe(
              mergeMap(
                (post) =>
                  this.postsApi.listComments(post.id).pipe(
                    catchError(() => of(null as unknown as Comment[])),
                    map((comments) => ({ post, comments })),
                  ),
                3,
              ),
              takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(({ post, comments }: any) => {
              const count = Array.isArray(comments) ? comments.length : 0;
              this.commentsCount.update((state) => ({ ...state, [post.id]: count }));
            });
        },
        error: (err) => {
          console.error('Failed to load posts for user:', err);
          this.toast.show('error', 'Unable to load user posts');
        },
        complete: () => this.postsLoading.set(false),
      });
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap()[postId];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  onToggleComments(postId: number): void {
    const current = this.commentsMap()[postId];
    if (current) {
      const next = { ...this.commentsMap() };
      delete next[postId];
      this.commentsMap.set(next);
      return;
    }

    this.commentsLoading.update((state) => ({ ...state, [postId]: true }));
    this.postsApi
      .listComments(postId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comments) => {
          this.commentsMap.update((state) => ({ ...state, [postId]: comments ?? [] }));
          this.commentsCount.update((state) => ({
            ...state,
            [postId]: Array.isArray(comments) ? comments.length : 0,
          }));
        },
        error: (err) => {
          console.error('Failed to load comments:', err);
          this.toast.show('error', 'Unable to load comments');
          this.commentsLoading.update((state) => ({ ...state, [postId]: false }));
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
    this.commentsCount.update((state) => ({
      ...state,
      [postId]: 1 + (state[postId] ?? this.commentsMap()[postId]?.length ?? 0),
    }));
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentsMap.update((state) => {
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
    this.commentsMap.update((state) => {
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
      [postId]: Math.max(0, (state[postId] ?? this.commentsMap()[postId]?.length ?? 1) - 1),
    }));
  }

  trackPostId(_idx: number, post: Post): number {
    return post.id;
  }
}
