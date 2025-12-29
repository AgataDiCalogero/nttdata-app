import { Injectable, inject } from '@angular/core';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { mapHttpError } from '@app/shared/utils/error-mapper';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  showError(message: string): void {
    this.toast.show('error', message);
  }

  showInfo(message: string): void {
    this.toast.show('info', message);
  }

  showSuccess(message: string): void {
    this.toast.show('success', message);
  }

  showHttpError(error: unknown, fallback: string, options?: { silent?: boolean }): string {
    const mapped = mapHttpError(error);
    const fallbackMessage = this.i18n.translate(fallback);
    const message =
      mapped.kind === 'unknown'
        ? fallbackMessage
        : this.i18n.translate(mapped.messageKey) || fallbackMessage;
    if (options?.silent !== true) {
      this.toast.show('error', message);
    }
    return message;
  }
}
