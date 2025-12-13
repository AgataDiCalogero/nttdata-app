import { Dialog } from '@angular/cdk/dialog';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import type { Comment as ModelComment, Post } from '@/app/shared/models/post';
import { UiOverlayService } from '@/app/shared/services/ui-overlay/ui-overlay.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, ButtonComponent, TranslatePipe],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostCardComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(Dialog);
  private readonly overlays = inject(UiOverlayService);

  readonly post = input.required<Post>();
  readonly isDeleting = input(false);
  readonly comments = input<ModelComment[]>([]);
  readonly commentsLoading = input(false);
  readonly authorName = input<string | null>(null);
  readonly commentsLoaded = input(false);
  readonly commentsPreviewCount = input<number | null | undefined>(undefined);
  readonly allowManage = input(true);

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

  get commentsList(): ModelComment[] {
    return this.comments() || [];
  }

  get commentCount(): number {
    return this.commentsPreviewCount() ?? this.post().comments_count ?? 0;
  }

  isExpanded = false;

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

  openCommentsModal(): void {
    const post = this.post();
    if (!post) return;

    // Trigger explicit load if needed?
    // The modal will use Facade.toggleComments which handles loading.

    import('../comments-modal/comments-modal.component').then(({ CommentsModalComponent }) => {
      const ref = this.dialog.open(CommentsModalComponent, {
        width: '500px',
        maxWidth: '95vw',
        height: '80vh',
        maxHeight: '100vh',
        panelClass: 'app-dialog-panel',
        backdropClass: 'app-dialog-overlay',
        data: { postId: post.id },
        autoFocus: false,
        restoreFocus: true,
      });

      this.overlays.activate({
        key: 'comments-modal',
        close: () => ref.close(),
        blockGlobalControls: true,
      });

      ref.closed.pipe(take(1)).subscribe(() => {
        this.overlays.release('comments-modal');
      });
    });
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
