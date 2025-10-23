import { AfterViewChecked, ChangeDetectionStrategy, Component, inject } from '@angular/core';

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
    role: 'status',

    ngSkipHydration: '',

    '(document:keydown.escape)': 'handleEscape($event)',
  },
})
export class ToastComponent implements AfterViewChecked {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.messages;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  ngAfterViewChecked(): void {
    // Guard against server-side execution where `document` is not available.
    if (typeof document === 'undefined') return;

    try {
      const container = document.querySelector('.toast-list');
      if (!container) return;
      const latest = container.querySelector<HTMLElement>('[data-toast-id]:last-child');
      if (latest) {
        latest.focus();
      }
    } catch (err) {
      // ignore DOM access errors during hydration / unexpected DOM changes
      // keep the debug log at debug level to avoid noisy logs in production
      console.debug('toast focus error', err);
    }
  }

  handleEscape(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
