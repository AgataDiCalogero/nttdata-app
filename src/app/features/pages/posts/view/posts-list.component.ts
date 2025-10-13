import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Post, Comment } from '@app/models';
import { PostCardComponent } from '../post-card/post-card.component';

@Component({
  standalone: true,
  selector: 'app-posts-list',
  imports: [CommonModule, PostCardComponent],
  templateUrl: './posts-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsListComponent {
  @Input() posts: Post[] = [];
  @Input() commentsMap: Record<number, Comment[] | undefined> = {};
  @Input() commentsLoading: Record<number, boolean> = {};
  @Input() deletingId: number | null = null;

  @Output() deletePost = new EventEmitter<Post>();
  @Output() toggleComments = new EventEmitter<number>();
  @Output() commentCreated = new EventEmitter<{ postId: number; comment: Comment }>();

  isDeleting(postId: number): boolean {
    return this.deletingId === postId;
  }

  commentsFor(postId: number): Comment[] | undefined {
    return this.commentsMap[postId];
  }
}
