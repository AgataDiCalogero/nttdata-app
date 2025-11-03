import { DestroyRef, Injectable, inject } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, take, tap } from 'rxjs';
import type { User } from '@/app/shared/models/user';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { injectUsersService } from './store/users.inject';
import { UserForm } from './user-form/user-form.component';
import { DeleteConfirmComponent } from '@/app/shared/dialog/delete-confirm/delete-confirm.component';

@Injectable()
export class UsersUiService {
  private readonly dialog = inject(Dialog);
  private readonly overlays = inject(UiOverlayService);
  private readonly dialogLayouts = inject(ResponsiveDialogService);
  private readonly notifications = inject(NotificationsService);
  private readonly usersApi = inject(UsersApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersStore = injectUsersService();

  openCreateUserModal(): void {
    const config = this.dialogLayouts.form<void, 'success' | 'cancel', UserForm>({
      ariaLabel: 'New user',
      desktop: { width: '37.5rem' },
    });
    const ref = this.dialog.open<'success' | 'cancel', void, UserForm>(UserForm, config);
    this.activateOverlay('user-form', ref);
    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      this.overlays.release('user-form');
      if (result === 'success') {
        this.notifications.showSuccess('User created');
        this.usersStore.loadUsers({ pushUrl: false });
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
            ariaLabel: 'Edit user',
            desktop: { width: '37.5rem' },
            data: { user },
          });
          const ref = this.dialog.open<'success' | 'cancel', { user: User }, UserForm>(
            UserForm,
            config,
          );
          this.activateOverlay('user-form', ref);
          ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
            this.overlays.release('user-form');
            if (result === 'success') {
              this.notifications.showSuccess('User updated');
              this.usersStore.loadUsers({ pushUrl: false });
            }
          });
        },
        error: (err) => {
          console.error('Failed to load user for edit:', err);
          this.notifications.showHttpError(err, 'Unable to load user details');
        },
      });
  }

  confirmDelete(user: User): void {
    const data: DeleteConfirmData = {
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      inProgressText: 'Deleting...',
      errorMessage: 'Unable to delete user right now. Please try again.',
      confirmAction: () => {
        this.usersStore.setDeleting(user.id);
        return this.usersApi.delete(user.id).pipe(
          tap({
            next: () => {
              this.notifications.showSuccess('User deleted');
              this.usersStore.loadUsers({ pushUrl: false });
            },
            error: (err) => {
              console.error('Delete failed:', err);
              const message = this.notifications.showHttpError(
                err,
                'Unable to delete user right now. Please try again.',
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
      panelClass: 'app-dialog-panel',
      ariaLabel: 'Delete user confirmation',
      autoFocus: true,
      restoreFocus: true,
      data,
    });
    this.activateOverlay('user-delete-confirm', ref);
    ref.closed.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.overlays.release('user-delete-confirm');
    });
  }

  private activateOverlay(key: string, ref: { close(): void }): void {
    this.overlays.activate({
      key,
      close: () => ref.close(),
      blockGlobalControls: true,
    });
  }
}
