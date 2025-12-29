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
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
  Circle,
} from 'lucide-angular';
import { tap } from 'rxjs';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { PostCardComponent } from '@/app/features/pages/posts/components/post-card/post-card.component';
import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import { PostCommentsDialogService } from '@/app/features/pages/posts/services/post-comments-dialog.service';
import { UsersFacadeService } from '@/app/features/pages/users/store/users-facade.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly pagination =
    inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
    DEFAULT_PAGINATION_CONFIG;
  private readonly commentsDialog = inject(PostCommentsDialogService);

  readonly Mail = Mail;
  readonly UserIcon = UserIcon;
  readonly MessageSquare = MessageSquare;
  readonly ArrowLeft = ArrowLeft;
  readonly Circle = Circle;

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly postsLoading = signal(true);

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

  readonly genderLabel = computed(() => {
    const genderRaw = this.user()?.gender;
    const gender = typeof genderRaw === 'string' ? genderRaw.trim() : '';
    if (gender.length === 0) {
      return this.i18n.translate('common.gender.unspecified');
    }
    const genderKey = gender.toLowerCase();
    if (genderKey === 'male' || genderKey === 'female') {
      return this.i18n.translate(`common.gender.${genderKey}`);
    }
    return this.i18n.translate('common.gender.unspecified');
  });

  readonly pageTitle = computed(() => {
    const nameRaw = this.user()?.name;
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : '';
    if (name.length > 0) {
      return name;
    }
    return this.i18n.translate('userDetail.title');
  });

  readonly statusLabel = computed(() => {
    const status = this.user()?.status;
    if (status === 'active') {
      return this.i18n.translate('common.status.active');
    }
    return this.i18n.translate('common.status.inactive');
  });

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

    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      const title = this.pageTitle();
      const suffix = this.i18n.translate('users.title');
      this.title.setTitle(`${title} | ${suffix}`);
    });
  }

  trackPostId(_idx: number, post: Post): number {
    return post.id;
  }

  handleViewComments(post: Post): void {
    const authorName = this.user()?.name ?? null;
    this.commentsDialog.open(post, authorName, { allowManage: false });
  }

  private resolveUserId(): number | null {
    const idParam = this.route.snapshot.paramMap.get('id') ?? '';
    const id = Number(idParam);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private createUserSignal(): Signal<User | null> {
    const errorMessage = this.i18n.translate('userDetail.unableToLoadUser');
    return toSignal(
      this.usersFacade.loadUserById(this.userId!, errorMessage, { silent: true }).pipe(
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
          { silent: true },
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
