import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { CardComponent } from '@app/shared/ui/card/card.component';
import { LucideAngularModule, MessageSquare, Trash2 } from 'lucide-angular';
import type { Post, Comment } from '@app/models';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent, CardComponent],
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

  // Check if post body is long enough to truncate
  shouldTruncate(): boolean {
    const body = this.post()?.body || '';
    return body.length > 200; // Truncate after 200 characters
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }
}
