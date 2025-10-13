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
    // Skip hydration for ephemeral toasts to avoid SSR/client DOM drift
    ngSkipHydration: '',
    // Accessibility: allow dismissing all toasts with Escape
    '(document:keydown.escape)': 'handleEscape($event)',
  },
})
export class ToastComponent implements AfterViewChecked {
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.messages;

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  // Focus the most recent toast for screen reader users when a new toast appears.
  // We keep this minimal to avoid layout thrashing; the template sets `tabindex="-1"` on toasts.
  ngAfterViewChecked(): void {
    try {
      const container = document.querySelector('.toast-list');
      if (!container) return;
      const latest = container.querySelector<HTMLElement>('[data-toast-id]:last-child');
      if (latest) {
        latest.focus();
      }
    } catch {
      // Defensive: DOM may be unavailable in some render targets
    }
  }

  /**
   * Allow users to dismiss all toasts with the Escape key as an accessibility fallback.
   * Note: host listener passes a generic Event; narrow to KeyboardEvent safely.
   */
  handleEscape(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
