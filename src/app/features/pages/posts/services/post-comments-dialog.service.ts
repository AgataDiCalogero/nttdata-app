import { Dialog } from '@angular/cdk/dialog';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import { PostCommentsDialogComponent } from '@/app/features/pages/posts/components/post-comments-dialog/post-comments-dialog.component';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Post } from '@/app/shared/models/post';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { OverlayKey, UiOverlayService } from '@/app/shared/services/ui-overlay/ui-overlay.service';

@Injectable({ providedIn: 'root' })
export class PostCommentsDialogService {
  private readonly dialog = inject(Dialog);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private readonly overlays = inject(UiOverlayService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commentsFacade = inject(CommentsFacadeService);

  open(post: Post, authorName?: string | null, options?: { allowManage?: boolean }): void {
    this.commentsFacade.toggleComments(post.id);
    const config = this.dialogLayouts.form({
      ariaLabel: this.i18n.translate('postComments.dialogAria', { title: post.title }),
      data: { post, authorName, allowManage: options?.allowManage },
      panelVariant: 'sheet',
      mobile: {
        maxHeight: '90vh',
        width: '100vw',
      },
      desktop: {
        width: '38rem',
        maxHeight: '90vh',
      },
    });

    const ref = this.dialog.open(PostCommentsDialogComponent, config);
    const key: OverlayKey = 'post-comments';
    this.overlays.activate({
      key,
      close: () => ref.close(),
      blockGlobalControls: true,
    });

    ref.closed
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.overlays.release(key));
  }
}
