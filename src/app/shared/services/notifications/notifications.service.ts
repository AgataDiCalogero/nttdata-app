import { Injectable, inject } from '@angular/core';

import { ToastService } from '@app/shared/ui/toast/toast.service';
import { mapHttpError } from '@app/shared/utils/error-mapper';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly toast = inject(ToastService);

  showError(message: string): void {
    this.toast.show('error', message);
  }

  showInfo(message: string): void {
    this.toast.show('info', message);
  }

  showSuccess(message: string): void {
    this.toast.show('success', message);
  }

  showHttpError(error: unknown, fallback: string): string {
    const mapped = mapHttpError(error);
    const message = mapped.message || fallback;
    this.toast.show('error', message);
    return message;
  }
}
