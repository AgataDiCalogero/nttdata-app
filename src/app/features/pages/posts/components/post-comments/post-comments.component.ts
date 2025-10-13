import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommentFormComponent } from '@/app/shared/comments/comment-form/comment-form.component';
import { LucideAngularModule, Heart } from 'lucide-angular';
import type { Comment } from '@/app/shared/models';

@Component({
  standalone: true,
  selector: 'app-post-comments',
  imports: [CommonModule, CommentFormComponent, LucideAngularModule],
  templateUrl: './post-comments.component.html',
  styleUrls: ['./post-comments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCommentsComponent {
  @Input() comments: Comment[] | null = null;
  @Input() loading = false;
  @Input() postId = 0;

  @Output() commentCreated = new EventEmitter<Comment>();

  readonly Heart = Heart;

  showReplies: number | null = null;
  showRepliesForm: number | null = null;
  likesMap = new Map<number, number>();
  newCommentIds = new Set<number>();
  hasMoreComments = false;

  isLiked(commentId: number): boolean {
    return (this.likesMap.get(commentId) || 0) > 0;
  }

  getLikesCount(commentId: number): number {
    return this.likesMap.get(commentId) || 0;
  }

  isNewComment(commentId: number): boolean {
    return this.newCommentIds.has(commentId);
  }

  onLikeComment(comment: Comment): void {
    const currentLikes = this.likesMap.get(comment.id) || 0;
    const newLikes = currentLikes > 0 ? 0 : 1;
    this.likesMap.set(comment.id, newLikes);
  }

  toggleReplyForm(comment: Comment): void {
    if (this.showRepliesForm === comment.id) {
      this.showRepliesForm = null;
    } else {
      this.showRepliesForm = comment.id;
    }
  }

  onCommentCreated($event: Comment): void {
    const newComment: Comment = {
      ...$event,
      id: Date.now(), // Temporary ID for new comments
      post_id: this.postId,
    };

    this.newCommentIds.add(newComment.id);
    this.commentCreated.emit(newComment);
  }

  onReplyCreated($event: Comment): void {
    const newReply: Comment = {
      ...$event,
      id: Date.now(),
      post_id: this.postId,
    };

    // For now, just emit the reply as a regular comment
    // In a real implementation, you'd handle nested comments differently
    this.newCommentIds.add(newReply.id);
    this.commentCreated.emit(newReply);

    // Hide reply form
    this.showRepliesForm = null;
  }

  onNestedCommentCreated(event: Comment): void {
    this.commentCreated.emit(event);
  }

  loadMoreComments(): void {
    // Implement pagination logic
    this.hasMoreComments = false; // Temporary
  }

  trackByCommentId(index: number, comment: Comment): number {
    return comment.id;
  }
}
