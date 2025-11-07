import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';

import { I18nService } from '@app/shared/i18n/i18n.service';

import type { Post, Comment } from '@/app/shared/models/post';

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
  readonly posts = input([] as Post[]);
  readonly commentsMap = input({} as Partial<Record<number, Comment[]>>);
  readonly commentsCountMap = input({} as Partial<Record<number, number>>);
  readonly commentsLoading = input({} as Partial<Record<number, boolean>>);
  readonly deletingId = input(null as number | null);
  readonly userLookup = input({} as Record<number, string>);
  private readonly i18n = inject(I18nService);

  readonly deletePost = output<Post>();
  readonly toggleComments = output<number>();
  readonly commentCreated = output<{ postId: number; comment: Comment }>();
  readonly commentUpdated = output<{ postId: number; comment: Comment }>();
  readonly commentDeleted = output<{ postId: number; commentId: number }>();
  readonly editPost = output<Post>();
  readonly viewAuthor = output<number>();

  isDeleting(postId: number): boolean {
    return this.deletingId() === postId;
  }

  commentsFor(postId: number): Comment[] {
    return this.commentsMap()[postId] ?? [];
  }

  commentsLoaded(postId: number): boolean {
    const map = this.commentsMap();
    return Object.hasOwn(map, postId);
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

  authorName(post: Post): string | null {
    const name = this.userLookup()[post.user_id];
    if (name) return name;
    return this.i18n.translate('userDetail.avatarFallback') + ' #' + post.user_id;
  }

  commentsAreLoading(postId: number): boolean {
    return Boolean(this.commentsLoading()[postId]);
  }

  onViewAuthor(post: Post): void {
    this.viewAuthor.emit(post.user_id);
  }

  trackPostById(_index: number, post: Post): number {
    return post.id;
  }
}
