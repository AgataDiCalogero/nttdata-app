import type { Observable } from 'rxjs';

export interface DeleteConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;

  confirmAction?: () => Promise<unknown> | Observable<unknown>;

  errorMessage?: string;

  inProgressText?: string;
}
