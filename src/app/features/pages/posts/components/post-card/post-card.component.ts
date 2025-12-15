import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Comment as ModelComment, Post } from '@/app/shared/models/post';
import { CommentFormComponent } from '@/app/shared/ui/comment-form/comment-form.component';

import { PostCommentsComponent } from '../post-comments/post-comments.component';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    ButtonComponent,
    TranslatePipe,
    PostCommentsComponent,
    CommentFormComponent,
  ],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  private readonly i18n = inject(I18nService);

  readonly post = input.required<Post>();
  readonly isDeleting = input(false);
  readonly comments = input<ModelComment[]>([]);
  readonly commentsLoading = input(false);
  readonly authorName = input<string | null>(null);
  readonly commentsLoaded = input(false);
  readonly commentsPreviewCount = input<number | null | undefined>(undefined);
  readonly allowManage = input(true);

  readonly commentsOpen = signal(false);

  readonly author = computed(() => {
    const provided = this.authorName();
    if (provided) return provided;

    const current = this.post();
    if (!current) {
      return this.i18n.translate('postCard.unknownAuthor');
    }

    const fallback = this.i18n.translate('userDetail.avatarFallback');
    return `${fallback} #${current.user_id}`;
  });

  readonly delete = output<void>();
  readonly toggleComments = output<void>();
  readonly edit = output<void>();
  readonly viewAuthor = output<number>();
  readonly commentCreated = output<ModelComment>();
  readonly commentUpdated = output<ModelComment>();
  readonly commentDeleted = output<number>();

  get commentCount(): number {
    return this.commentsPreviewCount() ?? this.post().comments_count ?? 0;
  }

  isExpanded = false;

  toggleCommentsPanel(): void {
    const next = !this.commentsOpen();
    this.commentsOpen.set(next);

    if (!next) {
      return;
    }

    if (this.commentsLoaded() || this.commentsLoading()) {
      return;
    }

    this.toggleComments.emit();
  }

  shouldTruncate(): boolean {
    const body = this.post().body || '';
    return body.length > 220;
  }

  previewText(): string {
    return this.preview(undefined, 220);
  }

  preview(text?: string, max = 220): string {
    const body = text ?? this.post().body ?? '';
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
    return `post-body-${current?.id ?? 'unknown'}`;
  }

  onEditClick(): void {
    this.edit.emit();
  }

  onAuthorClick(): void {
    const current = this.post();
    if (current) {
      this.viewAuthor.emit(current.user_id);
    }
  }
}
