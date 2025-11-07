import { Dialog } from '@angular/cdk/dialog';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';

import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';

import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import type { Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import { PostForm } from './components/post-form/post-form.component';
import { injectPostsService } from './store/posts.inject';

type DialogResult = { status: 'created' | 'updated'; post?: Post };
type PostFormDialogData = { users: User[]; post?: Post };

@Injectable()
export class PostsUiService {
  private readonly dialog = inject(Dialog);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private readonly overlays = inject(UiOverlayService);
  private readonly notifications = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly store = injectPostsService();

  openCreateDialog(): void {
    const users = this.store.userOptions();
    this.openPostFormDialog({
      label: this.i18n.translate('posts.create.ariaLabel'),
      data: { users },
    });
  }

  openEditDialog(post: Post): void {
    const users = this.store.userOptions();
    this.openPostFormDialog({
      label: this.i18n.translate('posts.update.ariaLabel', { title: post.title }),
      data: { users, post },
    });
  }

  confirmDelete(post: Post): void {
    const data: DeleteConfirmData = {
      title: this.i18n.translate('posts.delete.title'),
      message: this.i18n.translate('posts.delete.message', { title: post.title }),
      confirmText: this.i18n.translate('posts.delete.confirm'),
      cancelText: this.i18n.translate('posts.delete.cancel'),
      inProgressText: this.i18n.translate('posts.delete.deleting'),
      errorMessage: this.i18n.translate('posts.delete.error'),
      confirmAction: () => this.store.deletePostRequest(post),
    };

    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '26.25rem',
      maxWidth: '90vw',
      backdropClass: 'app-dialog-overlay',
      panelClass: 'app-dialog-panel',
      ariaLabel: this.i18n.translate('posts.delete.title'),
      autoFocus: true,
      restoreFocus: true,
      data,
    });
    this.overlays.activate({
      key: 'post-delete-confirm',
      close: () => ref.close(),
      blockGlobalControls: true,
    });
    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.overlays.release('post-delete-confirm');
    });
  }

  private openPostFormDialog(config: { label: string; data: PostFormDialogData }): void {
    const dialogConfig = this.dialogLayouts.form<PostFormDialogData, DialogResult, PostForm>({
      ariaLabel: config.label,
      desktop: { width: '38.75rem' },
      data: config.data,
    });
    const ref = this.dialog.open<DialogResult, PostFormDialogData, PostForm>(
      PostForm,
      dialogConfig,
    );

    this.overlays.activate({
      key: 'post-form',
      close: () => ref.close(),
      blockGlobalControls: true,
    });

    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      this.overlays.release('post-form');
      if (!result || typeof result !== 'object' || !('status' in result)) {
        return;
      }

      if (result.status === 'created') {
        this.notifications.showSuccess(this.i18n.translate('posts.create.success'));
        this.store.setPage(1);
        this.store.refresh();
        return;
      }

      if (result.status === 'updated' && result.post) {
        this.notifications.showSuccess(this.i18n.translate('posts.update.success'));
        this.store.onPostUpdated(result.post);
      }
    });
  }
}
