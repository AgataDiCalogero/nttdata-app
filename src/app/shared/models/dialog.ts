import type { Observable } from 'rxjs';

// Types for dialog components
export interface DeleteConfirmData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /**
   * Optional async action executed when the user confirms.
   * Returning a promise or observable keeps the dialog open until it completes.
   */
  confirmAction?: () => Promise<unknown> | Observable<unknown>;
  /**
   * Optional custom error message shown when confirmAction rejects.
   */
  errorMessage?: string;
  /**
   * Optional custom label shown on the confirm button while confirmAction runs.
   */
  inProgressText?: string;
}
