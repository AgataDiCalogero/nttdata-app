import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Post, Comment } from '@/app/shared/models';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  standalone: true,
  selector: 'app-posts-list',
  imports: [CommonModule, PostCardComponent],
  templateUrl: './posts-list.component.html',
  styleUrls: ['./posts-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsListComponent {
  @Input() posts: Post[] = [];
  @Input() commentsMap: Record<number, Comment[] | undefined> = {};
  @Input() commentsLoading: Record<number, boolean> = {};
  @Input() deletingId: number | null = null;
  @Input() userLookup: Record<number, string> = {};

  @Output() deletePost = new EventEmitter<Post>();
  @Output() toggleComments = new EventEmitter<number>();
  @Output() commentCreated = new EventEmitter<{ postId: number; comment: Comment }>();
  @Output() commentUpdated = new EventEmitter<{ postId: number; comment: Comment }>();
  @Output() editPost = new EventEmitter<Post>();

  isDeleting(postId: number): boolean {
    return this.deletingId === postId;
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap[postId];
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

  authorName(post: Post): string | undefined {
    return this.userLookup[post.user_id];
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading[postId]);
  }
}
