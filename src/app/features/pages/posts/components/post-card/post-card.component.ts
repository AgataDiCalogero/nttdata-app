import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  AfterViewChecked,
  ViewChild,
  input,
  output,
} from '@angular/core';
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
export class PostCardComponent implements AfterViewChecked {
  @ViewChild('commentsSection') commentsSection?: ElementRef<HTMLElement>;

  readonly post = input.required<Post>();
  readonly interactive = input(false);
  readonly padding = input<'none' | 'compact' | 'default' | 'spacious'>('default');
  readonly isDeleting = input(false);
  readonly comments = input<ModelComment[] | null | undefined>(undefined);
  readonly commentsLoading = input(false);
  readonly authorName = input<string | null>(null);
  readonly allowManage = input(true);
  readonly Trash2 = Trash2;
  readonly MessageSquare = MessageSquare;
  readonly Pencil = Pencil;

  readonly delete = output<void>();
  readonly toggleComments = output<void>();
  readonly edit = output<void>();
  readonly viewAuthor = output<number>();
  readonly commentCreated = output<ModelComment>();
  readonly commentUpdated = output<ModelComment>();
  readonly commentDeleted = output<number>();

  isExpanded = false;
  private pendingCommentsReveal = false;

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

  onComposeComment(visible: boolean): void {
    if (!visible) {
      this.pendingCommentsReveal = true;
      this.toggleComments.emit();
    } else {
      this.focusComments();
    }
  }

  ngAfterViewChecked(): void {
    if (this.pendingCommentsReveal && this.commentsSection) {
      this.pendingCommentsReveal = false;
      this.focusComments();
    }
  }

  onAuthorClick(): void {
    const current = this.post();
    if (current) {
      this.viewAuthor.emit(current.user_id);
    }
  }

  private focusComments(): void {
    const element = this.commentsSection?.nativeElement;
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    element.querySelector('textarea')?.focus();
  }
}
