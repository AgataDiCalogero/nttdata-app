import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { take } from 'rxjs';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import { DialogOverlayCoordinator } from '@/app/shared/services/ui-overlay/dialog-overlay-coordinator.service';
import { ToastService } from '@/app/shared/ui/toast/toast.service';

import { TokenHelpDialogComponent } from '../../token-help-dialog/token-help-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class LoginUiService {
  private readonly dialog = inject(Dialog);
  private readonly overlayCoordinator = inject(DialogOverlayCoordinator);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  /**
   * Opens the token help dialog with proper overlay management
   */
  openTokenHelp(): void {
    const dialogRef = this.dialog.open(TokenHelpDialogComponent, {
      autoFocus: false,
      panelClass: ['token-help-dialog', 'app-dialog-panel', 'app-dialog--sm'],
      backdropClass: 'app-dialog-overlay',
    });

    const releaseOverlay = this.overlayCoordinator.coordinate('token-help-dialog', dialogRef);
    dialogRef.closed.pipe(take(1)).subscribe(() => {
      releaseOverlay();
    });
  }

  /**
   * Shows an error toast message
   */
  showError(message: string, duration = 5000): void {
    this.toast.show('error', message, duration);
  }

  /**
   * Shows a success toast message
   */
  showSuccess(message: string, duration = 3000): void {
    this.toast.show('success', message, duration);
  }

  /**
   * Gets translated error message for login errors
   */
  getErrorMessage(key: string, params?: Record<string, string | number>): string {
    return this.i18n.translate(key, params);
  }
}
