import { DestroyRef, Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import type { Post } from '@/app/shared/models/post';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import type { User } from '@/app/shared/models/user';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { injectPostsService } from './store/posts.inject';
import { PostForm } from './components/post-form/post-form.component';
import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';

type DialogResult = { status: 'created' | 'updated'; post?: Post };
type PostFormDialogData = { users: User[]; post?: Post };

@Injectable()
export class PostsUiService {
  private readonly dialog = inject(Dialog);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private readonly overlays = inject(UiOverlayService);
  private readonly notifications = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly store = injectPostsService();

  openCreateDialog(): void {
    const users = this.store.userOptions();
    this.openPostFormDialog({
      label: 'New post',
      data: { users },
    });
  }

  openEditDialog(post: Post): void {
    const users = this.store.userOptions();
    this.openPostFormDialog({
      label: `Edit post ${post.title}`,
      data: { users, post },
    });
  }

  confirmDelete(post: Post): void {
    const data: DeleteConfirmData = {
      title: 'Delete Post',
      message: `Are you sure you want to delete "${post.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      inProgressText: 'Deleting...',
      errorMessage: 'Unable to delete this post right now. Please try again.',
      confirmAction: () => this.store.deletePostRequest(post),
    };

    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '26.25rem',
      maxWidth: '90vw',
      backdropClass: 'app-dialog-overlay',
      panelClass: 'app-dialog-panel',
      ariaLabel: 'Delete post confirmation',
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
        this.notifications.showSuccess('Post created');
        this.store.setPage(1);
        this.store.refresh();
        return;
      }

      if (result.status === 'updated' && result.post) {
        this.notifications.showSuccess('Post updated');
        this.store.onPostUpdated(result.post);
      }
    });
  }
}
