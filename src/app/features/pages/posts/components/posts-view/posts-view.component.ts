import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { LucideAngularModule, Plus } from 'lucide-angular';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PaginationComponent } from '@app/shared/ui/pagination/pagination.component';
import { PostCardSkeletonComponent } from '@app/shared/ui/skeletons/post-card-skeleton.component';

import type { Comment, Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';

import type { PostsFiltersFormGroup } from '../../store/posts-filters.service';
import { PostsFiltersComponent } from '../posts-filters/posts-filters.component';
import { PostsListComponent } from '../posts-list/posts-list.component';

@Component({
  selector: 'app-posts-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    PaginationComponent,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
    AlertComponent,
    PostsFiltersComponent,
    PostsListComponent,
    PostCardSkeletonComponent,
    TranslatePipe,
  ],
  templateUrl: './posts-view.component.html',
  styleUrls: ['./posts-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsViewComponent {
  private readonly numberFormatter = new Intl.NumberFormat('en-US');
  private readonly i18n = inject(I18nService);
  readonly searchForm = input.required<PostsFiltersFormGroup>();
  readonly userOptions = input.required<User[]>();
  readonly loading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly posts = input.required<Post[]>();
  readonly commentsMap = input.required<Partial<Record<number, Comment[]>>>();
  readonly commentsLoading = input.required<Partial<Record<number, boolean>>>();
  readonly commentsCountMap = input.required<Partial<Record<number, number>>>();
  readonly perPageOptions = input.required<number[]>();
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPerPage = input.required<number>();
  readonly hasPagination = input.required<boolean>();
  readonly deletingId = input<number | null>(null);
  readonly totalPosts = input.required<number>();
  readonly userLookup = input.required<Record<number, string>>();
  readonly resultsSummary = computed(() => {
    if (this.loading()) {
      return this.i18n.translate('posts.loading');
    }
    const visible = this.posts().length;
    const total = this.totalPosts();
    if (!total) {
      return this.i18n.translate('posts.emptyState');
    }
    const formattedVisible = this.numberFormatter.format(visible);
    const formattedTotal = this.numberFormatter.format(total);
    if (visible === total) {
      return this.i18n.translate('posts.summary.all', { total: formattedTotal });
    }
    return this.i18n.translate('posts.summary.partial', {
      visible: formattedVisible,
      total: formattedTotal,
    });
  });

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();
  readonly toggleComments = output<number>();
  readonly deletePost = output<Post>();
  readonly commentCreated = output<{ postId: number; comment: Comment }>();
  readonly commentUpdated = output<{ postId: number; comment: Comment }>();
  readonly commentDeleted = output<{ postId: number; commentId: number }>();
  readonly changePage = output<number>();
  readonly changePerPage = output<number>();
  readonly editPost = output<Post>();
  readonly viewAuthor = output<number>();
  readonly retry = output<void>();

  readonly Plus = Plus;

  readonly perPageSelectOptions = computed(() =>
    this.perPageOptions().map((size) => ({
      value: size,
      label: this.i18n.translate('users.filters.perPageOption', {
        value: this.numberFormatter.format(size),
      }),
    })),
  );

  protected readonly perPageControl = new FormControl<number>(10, { nonNullable: true });

  constructor() {
    effect(() => {
      const v = this.currentPerPage();
      if (typeof v === 'number' && this.perPageControl.value !== v) {
        this.perPageControl.setValue(v, { emitEvent: false });
      }
    });
  }

  isDeleting(postId: number): boolean {
    return this.deletingId() === postId;
  }

  commentsFor(postId: number): Comment[] {
    return this.commentsMap()[postId] ?? [];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  onCommentCreated(postId: number, comment: Comment): void {
    this.commentCreated.emit({ postId, comment });
  }

  onEditPost(post: Post): void {
    this.editPost.emit(post);
  }

  onCommentUpdated(postId: number, comment: Comment): void {
    this.commentUpdated.emit({ postId, comment });
  }

  onCommentDeleted(postId: number, commentId: number): void {
    this.commentDeleted.emit({ postId, commentId });
  }

  onViewAuthor(userId: number): void {
    this.viewAuthor.emit(userId);
  }

  trackPostById(_index: number, post: Post): number {
    return post.id;
  }

  trackUserById(_index: number, user: User): number {
    return user.id;
  }

  trackByCommentId(_index: number, comment: Comment): number {
    return comment.id;
  }
}
