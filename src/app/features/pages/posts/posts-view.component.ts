import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Plus } from 'lucide-angular';
import type { Comment, Post, User } from '@app/models';
import { CommentForm } from '../../../shared/comments/comment-form/comment-form.component';
import { ButtonComponent } from '@app/shared/ui/button';
import { CardComponent } from '@app/shared/ui/card';
import { PostCardComponent } from './post-card/post-card.component';
import { DebounceInputDirective } from '@app/shared/directives';

@Component({
  selector: 'app-posts-view',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommentForm,
    ButtonComponent,
    CardComponent,
    PostCardComponent,
    DebounceInputDirective,
  ],
  templateUrl: './posts-view.component.html',
  styleUrls: ['./posts.component.scss'],
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

  @Output() createPost = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() toggleComments = new EventEmitter<number>();
  @Output() deletePost = new EventEmitter<Post>();
  @Output() commentCreated = new EventEmitter<{ postId: number; comment: Comment }>();
  @Output() changePage = new EventEmitter<number>();
  @Output() changePerPage = new EventEmitter<number>();

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

  trackPostById(_index: number, post: Post): number {
    return post.id;
  }
}
