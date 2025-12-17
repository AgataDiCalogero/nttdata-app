import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Post } from '@/app/shared/models/post';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, ButtonComponent, TranslatePipe],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  private readonly i18n = inject(I18nService);

  readonly post = input.required<Post>();
  readonly isDeleting = input(false);
  readonly authorName = input<string | null>(null);
  readonly commentsPreviewCount = input<number | null | undefined>(undefined);
  readonly allowManage = input(true);
  readonly author = computed(() => {
    const provided = this.authorName();
    if (provided != null && provided !== '') return provided;

    const current = this.post();
    const fallback = this.i18n.translate('userDetail.avatarFallback');
    return `${fallback} #${current.user_id}`;
  });

  readonly delete = output<void>();
  readonly edit = output<void>();
  readonly viewAuthor = output<number>();
  readonly viewComments = output<Post>();

  get commentCount(): number {
    return this.commentsPreviewCount() ?? this.post().comments_count ?? 0;
  }

  isExpanded = false;

  shouldTruncate(): boolean {
    const body = this.post().body;
    return body.length > 220;
  }

  previewText(): string {
    return this.preview(undefined, 220);
  }

  preview(text?: string, max = 220): string {
    const body = text ?? this.post().body;
    if (body.length <= max) {
      return body;
    }

    const truncated = body.slice(0, max);
    return truncated.replace(/\s+\S*$/, '') + '...';
  }

  toggleExpansion(): void {
    this.isExpanded = !this.isExpanded;
  }

  bodyId(): string {
    const current = this.post();
    return `post-body-${current.id}`;
  }

  onEditClick(): void {
    this.edit.emit();
  }

  onAuthorClick(): void {
    const current = this.post();
    this.viewAuthor.emit(current.user_id);
  }

  onViewComments(): void {
    const current = this.post();
    this.viewComments.emit(current);
  }
}
