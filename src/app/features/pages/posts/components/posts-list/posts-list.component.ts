import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, inject } from '@angular/core';

import { I18nService } from '@app/shared/i18n/i18n.service';

import type { Post } from '@/app/shared/models/post';

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
  readonly commentsCountMap = input({} as Partial<Record<number, number>>);
  readonly deletingId = input(null as number | null);
  readonly userLookup = input({} as Record<number, string>);
  private readonly i18n = inject(I18nService);

  readonly deletePost = output<Post>();
  readonly editPost = output<Post>();
  readonly viewComments = output<Post>();
  readonly viewAuthor = output<number>();

  isDeleting(postId: number): boolean {
    return this.deletingId() === postId;
  }

  onEditPost(post: Post): void {
    this.editPost.emit(post);
  }

  authorName(post: Post): string | null {
    const name = this.userLookup()[post.user_id];
    if (name) return name;
    return this.i18n.translate('userDetail.avatarFallback') + ' #' + post.user_id;
  }

  onViewAuthor(post: Post): void {
    this.viewAuthor.emit(post.user_id);
  }

  trackPostById(_index: number, post: Post): number {
    return post.id;
  }
}
