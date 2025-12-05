import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  signal,
  type Signal,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
  FileText,
} from 'lucide-angular';
import { tap } from 'rxjs';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { StatusBadgeComponent } from '@app/shared/ui/status-badge/status-badge.component';

import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { UsersFacadeService } from '@/app/features/pages/users/store/users-facade.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Post, Comment } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { AlertComponent } from '@/app/shared/ui/alert/alert.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonComponent,
    AlertComponent,
    PostCardComponent,
    LucideAngularModule,
    MatCardModule,
    StatusBadgeComponent,
    MatProgressBarModule,
    TranslatePipe,
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly usersFacade = inject(UsersFacadeService);
  private readonly commentsFacade = inject(CommentsFacadeService);
  private readonly notifications = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly usersApi = inject(UsersApiService);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly pagination =
    inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
    DEFAULT_PAGINATION_CONFIG;

  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;
  readonly FileText = FileText;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly postsLoading = signal(true);

  readonly commentsMap = computed(() => this.commentsFacade.comments());
  readonly commentsLoading = computed(() => this.commentsFacade.loading());
  readonly commentsCount = computed(() => this.commentsFacade.counts());

  private readonly userId = this.resolveUserId();
  private readonly postsFetchLimit = Math.max(
    ...this.pagination.perPageOptions,
    this.pagination.defaultPerPage,
  );
  private userSource: Signal<User | null> = signal<User | null>(null);
  private postsSource: Signal<Post[]> = signal<Post[]>([]);

  readonly user = signal<User | null>(null);
  readonly posts = computed(() => this.postsSource());

  constructor() {
    if (this.userId === null) {
      this.userSource = signal<User | null>(null);
      this.user.set(null);
      this.error.set(this.i18n.translate('userDetail.invalidUserId'));
      this.loading.set(false);
      this.postsLoading.set(false);
      return;
    }

    if (!this.isBrowser) {
      this.loading.set(false);
      this.postsLoading.set(false);
      return;
    }

    this.userSource = this.createUserSignal();
    this.postsSource = this.createPostsSignal();

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
    return this.commentsMap()[postId] ?? [];
  }

  commentsLoaded(postId: number): boolean {
    return Object.hasOwn(this.commentsMap(), postId);
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  async onToggleComments(postId: number): Promise<void> {
    this.commentsFacade.toggleComments(postId, {
      errorMessage: this.i18n.translate('userDetail.unableToLoadComments'),
    });
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentsFacade.applyCreated(postId, comment);
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentsFacade.applyUpdated(postId, comment);
  }

  onCommentDeleted(postId: number, commentId: number): void {
    this.commentsFacade.applyDeleted(postId, commentId);
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
          this.notifications.showHttpError(
            err,
            this.i18n.translate('userDetail.unableToUpdateStatus'),
          );
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
    const errorMessage = this.i18n.translate('userDetail.unableToLoadUser');
    return toSignal(
      this.usersFacade.loadUserById(this.userId!, errorMessage).pipe(
        tap((user) => {
          this.error.set(user ? null : errorMessage);
          this.loading.set(false);
        }),
      ),
      { initialValue: null },
    );
  }

  private createPostsSignal(): Signal<Post[]> {
    return toSignal(
      this.usersFacade
        .loadPostsForUser(
          this.userId!,
          this.postsFetchLimit,
          this.i18n.translate('userDetail.unableToLoadPosts'),
        )
        .pipe(
          tap(() => {
            this.postsLoading.set(false);
          }),
        ),
      { initialValue: [] },
    );
  }

  private async prefetchCommentCounts(posts: Post[]): Promise<void> {
    await this.commentsFacade.prefetchCounts(posts);
  }
}
