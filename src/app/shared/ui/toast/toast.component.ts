import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'toast-container',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.messages;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  /**
   * Allow users to dismiss all toasts with the Escape key as an accessibility fallback.
   */
  @HostListener('document:keydown.escape', ['$event'])
  handleEscape(event: KeyboardEvent): void {
    if (event.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
