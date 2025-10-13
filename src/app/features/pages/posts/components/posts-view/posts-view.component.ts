import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { PostsFiltersComponent } from '../posts-filters/posts-filters.component';
import { PostsListComponent } from '../posts-list/posts-list.component';
import type { Comment, Post, User } from '@/app/shared/models';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';

@Component({
  selector: 'app-posts-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    ButtonComponent,
    CardComponent,
    PostsFiltersComponent,
    PostsListComponent,
  ],
  templateUrl: './posts-view.component.html',
  styleUrls: ['./posts-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsViewComponent {
  @Input({ required: true }) searchForm!: FormGroup;
  @Input() userOptions: User[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() posts: Post[] = [];
  @Input() commentsMap: Record<number, Comment[] | undefined> = {};
  @Input() commentsLoading: Record<number, boolean> = {};
  @Input() perPageOptions: number[] = [];
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() currentPerPage = 10;
  @Input() hasPagination = false;
  @Input() deletingId: number | null = null;
  @Input() postsCount = 0;
  @Input() userLookup: Record<number, string> = {};

  @Output() createPost = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() toggleComments = new EventEmitter<number>();
  @Output() deletePost = new EventEmitter<Post>();
  @Output() commentCreated = new EventEmitter<{ postId: number; comment: Comment }>();
  @Output() commentUpdated = new EventEmitter<{ postId: number; comment: Comment }>();
  @Output() changePage = new EventEmitter<number>();
  @Output() changePerPage = new EventEmitter<number>();
  @Output() editPost = new EventEmitter<Post>();

  readonly Plus = Plus;

  isDeleting(postId: number): boolean {
    return this.deletingId === postId;
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap[postId];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading[postId]);
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
