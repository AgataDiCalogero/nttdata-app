import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { LucideAngularModule, MessageSquare, Pencil, Trash2 } from 'lucide-angular';
import type { Comment as ModelComment, Post } from '@/app/shared/models';
import { PostCommentsComponent } from '../post-comments/post-comments.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ButtonComponent,
    CardComponent,
    PostCommentsComponent,
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  readonly post = input<Post>();
  readonly interactive = input(false);
  readonly padding = input<'none' | 'compact' | 'default' | 'spacious'>('default');
  readonly isDeleting = input(false);
  readonly comments = input<ModelComment[] | null | undefined>(null);
  readonly commentsLoading = input(false);
  readonly authorName = input<string | null>(null);
  readonly allowManage = input(true);

  readonly Trash2 = Trash2;
  readonly MessageSquare = MessageSquare;
  readonly Pencil = Pencil;

  @Output() readonly delete = new EventEmitter<void>();
  @Output() readonly toggleComments = new EventEmitter<void>();
  @Output() readonly edit = new EventEmitter<void>();
  @Output() readonly viewAuthor = new EventEmitter<number>();
  @Output() readonly commentCreated = new EventEmitter<ModelComment>();
  @Output() readonly commentUpdated = new EventEmitter<ModelComment>();
  @Output() readonly commentDeleted = new EventEmitter<number>();

  isExpanded = false;

  shouldTruncate(): boolean {
    const body = this.post()?.body || '';
    return body.length > 220;
  }

  previewText(): string {
    return this.preview(undefined, 220);
  }

  preview(text?: string, max = 220): string {
    const body = text ?? this.post()?.body ?? '';
    if (body.length <= max) {
      return body;
    }

    const truncated = body.slice(0, max);
    return truncated.replace(/\s+\S*$/, '') + '...';
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }

  onInternalCommentCreated(comment: ModelComment): void {
    this.commentCreated.emit(comment);
  }

  onInternalCommentUpdated(comment: ModelComment): void {
    this.commentUpdated.emit(comment);
  }

  onInternalCommentDeleted(commentId: number): void {
    this.commentDeleted.emit(commentId);
  }

  onAuthorClick(): void {
    const current = this.post();
    if (current) {
      this.viewAuthor.emit(current.user_id);
    }
  }
}
