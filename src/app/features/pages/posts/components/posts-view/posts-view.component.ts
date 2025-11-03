import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Plus } from 'lucide-angular';
import type { Comment, Post, User } from '@/app/shared/models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { PaginationComponent } from '@app/shared/ui/pagination/pagination.component';
import { LoaderComponent } from '@app/shared/ui/loader/loader.component';
import { AlertComponent } from '@app/shared/ui/alert/alert.component';
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
    LoaderComponent,
    AlertComponent,
    PostsFiltersComponent,
    PostsListComponent,
  ],
  templateUrl: './posts-view.component.html',
  styleUrls: ['./posts-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsViewComponent {
  readonly searchForm = input.required<FormGroup>();
  readonly userOptions = input.required<User[]>();
  readonly loading = input.required<boolean>();
  readonly error = input<string | null>(null);
  readonly posts = input.required<Post[]>();
  readonly commentsMap = input.required<Record<number, Comment[] | undefined>>();
  readonly commentsLoading = input.required<Record<number, boolean>>();
  readonly commentsCountMap = input.required<Record<number, number>>();
  readonly perPageOptions = input.required<number[]>();
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly currentPerPage = input.required<number>();
  readonly hasPagination = input.required<boolean>();
  readonly deletingId = input<number | null>(null);
  readonly postsCount = input.required<number>();
  readonly userLookup = input.required<Record<number, string>>();

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();
  readonly toggleComments = output<number>();
  readonly deletePost = output<Post>();
  readonly commentCreated = output<{ postId: number; comment: Comment }>();
  readonly commentUpdated = output<{ postId: number; comment: Comment }>();
  readonly changePage = output<number>();
  readonly changePerPage = output<number>();
  readonly editPost = output<Post>();
  readonly viewAuthor = output<number>();

  readonly Plus = Plus;

  readonly perPageSelectOptions = computed(() =>
    this.perPageOptions().map((size) => ({ value: size, label: size.toString() })),
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

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap()[postId];
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
