import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { LucideAngularModule, MessageSquare, Trash2 } from 'lucide-angular';
import { CommentForm } from '@app/shared/comments/comment-form/comment-form.component';
import type { Post, Comment } from '@/app/shared/models';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent, CardComponent, CommentForm],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  readonly post = input<Post>();
  readonly interactive = input(false);
  readonly padding = input<'none' | 'compact' | 'default' | 'spacious'>('default');
  readonly isDeleting = input(false);
  readonly comments = input<Comment[] | null | undefined>(null);

  // Expose Lucide icons for template binding
  readonly Trash2 = Trash2;
  readonly MessageSquare = MessageSquare;

  @Output() readonly delete = new EventEmitter<void>();
  @Output() readonly toggleComments = new EventEmitter<void>();

  // Text expansion state
  isExpanded = false;

  // Per-comment expansion map (comment id -> expanded)
  readonly expandedComments = new Set<number>();

  isCommentExpanded(commentId: number): boolean {
    return this.expandedComments.has(commentId);
  }

  toggleCommentExpansion(commentId: number): void {
    if (this.expandedComments.has(commentId)) {
      this.expandedComments.delete(commentId);
    } else {
      this.expandedComments.add(commentId);
    }
  }

  // Check if post body is long enough to truncate
  shouldTruncate(): boolean {
    const body = this.post()?.body || '';
    return body.length > 200; // Truncate after 200 characters
  }

  // Return a safe preview (truncate by characters but avoid cutting mid-word)
  previewText(): string {
    return this.preview(undefined, 200);
  }

  // Generic preview helper for any text
  preview(text?: string, max = 200): string {
    const body = text ?? this.post()?.body ?? '';
    if (body.length <= max) return body;
    const truncated = body.slice(0, max);
    // avoid breaking last word
    return truncated.replace(/\s+\S*$/, '') + '…';
  }

  // Generic truncation check for arbitrary text
  shouldTruncateText(text?: string, max = 200): boolean {
    const body = text ?? this.post()?.body ?? '';
    return body.length > max;
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }
}
