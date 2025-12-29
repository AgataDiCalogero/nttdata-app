import { Dialog } from '@angular/cdk/dialog';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, take, tap } from 'rxjs';

import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import type { User } from '@/app/shared/models/user';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import {
  DialogOverlayCoordinator,
  type OverlayKey,
} from '@/app/shared/services/ui-overlay/dialog-overlay-coordinator.service';
import { DeleteConfirmComponent } from '@/app/shared/ui/dialog/delete-confirm.component';

import { injectUsersService } from '../store/users.inject';
import { UserForm } from '../user-components/user-form/user-form.component';

@Injectable()
export class UsersUiService {
  private readonly dialog = inject(Dialog);
  private readonly overlayCoordinator = inject(DialogOverlayCoordinator);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private readonly notifications = inject(NotificationsService);
  private readonly usersApi = inject(UsersApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly usersStore = injectUsersService();

  openCreateUserModal(): void {
    const config = this.dialogLayouts.form<void, 'success' | 'cancel', UserForm>({
      ariaLabel: this.i18n.translate('users.create.ariaLabel'),
      panelVariant: 'md',
      desktop: { width: '37.5rem' },
      shared: { panelClass: 'app-dialog--scrollable' },
    });
    const ref = this.dialog.open<'success' | 'cancel', void, UserForm>(UserForm, config);
    const releaseOverlay = this.activateOverlay('user-form', ref);
    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      releaseOverlay();
      if (result === 'success') {
        this.notifications.showSuccess(this.i18n.translate('users.create.success'));
        this.usersStore.loadUsers({ pushUrl: false, forceReload: true });
      }
    });
  }

  openEditUserModal(userId: number): void {
    this.usersApi
      .getById(userId)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          const config = this.dialogLayouts.form<{ user: User }, 'success' | 'cancel', UserForm>({
            ariaLabel: this.i18n.translate('users.update.ariaLabel'),
            panelVariant: 'md',
            desktop: { width: '37.5rem' },
            shared: { panelClass: 'app-dialog--scrollable' },
            data: { user },
          });
          const ref = this.dialog.open<'success' | 'cancel', { user: User }, UserForm>(
            UserForm,
            config,
          );
          const releaseOverlay = this.activateOverlay('user-form', ref);
          ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
            releaseOverlay();
            if (result === 'success') {
              this.notifications.showSuccess(this.i18n.translate('users.update.success'));
              this.usersStore.loadUsers({ pushUrl: false, forceReload: true });
            }
          });
        },
        error: (err) => {
          console.error('Failed to load user for edit:', err);
          this.notifications.showHttpError(err, this.i18n.translate('userDetail.unableToLoadUser'));
        },
      });
  }

  confirmDelete(user: User): void {
    const data: DeleteConfirmData = {
      title: this.i18n.translate('users.delete.title'),
      message: this.i18n.translate('users.delete.message', { name: user.name }),
      confirmText: this.i18n.translate('users.delete.confirm'),
      cancelText: this.i18n.translate('users.delete.cancel'),
      inProgressText: this.i18n.translate('users.delete.deleting'),
      errorMessage: this.i18n.translate('users.delete.error'),
      confirmAction: () => {
        this.usersStore.setDeleting(user.id);
        return this.usersApi.delete(user.id).pipe(
          tap({
            next: () => {
              this.notifications.showSuccess(this.i18n.translate('users.delete.success'));
              this.usersStore.loadUsers({ pushUrl: false, forceReload: true });
            },
            error: (err) => {
              console.error('Delete failed:', err);
              const message = this.notifications.showHttpError(
                err,
                this.i18n.translate('users.delete.error'),
              );
              throw new Error(message);
            },
          }),
          finalize(() => this.usersStore.setDeleting(null)),
        );
      },
    };

    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '25rem',
      maxWidth: '90vw',
      backdropClass: 'app-dialog-overlay',
      panelClass: ['app-dialog-panel', 'app-dialog--sm'],
      ariaLabel: this.i18n.translate('users.delete.title'),
      autoFocus: true,
      restoreFocus: true,
      data,
    });
    const releaseConfirmOverlay = this.activateOverlay('user-delete-confirm', ref);
    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      releaseConfirmOverlay();
    });
  }

  private activateOverlay(key: OverlayKey, ref: { close(): void }): () => void {
    return this.overlayCoordinator.coordinate(key, ref);
  }
}
