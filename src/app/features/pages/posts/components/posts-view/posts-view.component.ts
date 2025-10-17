import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Plus } from 'lucide-angular';
import type { Comment, Post, User } from '@/app/shared/models';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
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
    SelectComponent,
    ButtonComponent,
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
  readonly searchForm = input(null as unknown as FormGroup);
  readonly userOptions = input([] as User[]);
  readonly loading = input(false);
  readonly error = input(null as string | null);
  readonly posts = input([] as Post[]);
  readonly commentsMap = input({} as Record<number, Comment[] | undefined>);
  readonly commentsLoading = input({} as Record<number, boolean>);
  readonly perPageOptions = input([] as number[]);
  readonly currentPage = input(1);
  readonly totalPages = input(1);
  readonly currentPerPage = input(10);
  readonly hasPagination = input(false);
  readonly deletingId = input(null as number | null);
  readonly postsCount = input(0);
  readonly userLookup = input({} as Record<number, string>);

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();
  readonly refresh = output<void>();
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
