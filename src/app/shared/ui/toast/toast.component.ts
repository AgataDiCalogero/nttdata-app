import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, effect, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'toast-container',
    '[attr.aria-live]': 'ariaLive',
    'aria-atomic': 'true',
    role: 'status',
    ngSkipHydration: '',

    '(document:keydown.escape)': 'handleEscape($event)',
  },
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private lastFocusedId: string | null = null;
  readonly toasts = this.toastService.messages;

  get ariaLive(): 'polite' | 'assertive' {
    return this.toasts().some((toast) => toast.type === 'error') ? 'assertive' : 'polite';
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  constructor() {
    effect(() => {
      if (!this.isBrowser) {
        this.lastFocusedId = null;
        return;
      }

      const messages = this.toasts();
      if (!messages.length) {
        this.lastFocusedId = null;
        return;
      }

      const latest = messages[messages.length - 1];
      if (!latest || latest.id === this.lastFocusedId) return;

      queueMicrotask(() => {
        try {
          const container = document.querySelector('.toast-list');
          const target =
            container?.querySelector<HTMLElement>(`[data-toast-id="${latest.id}"]`) ??
            container?.querySelector<HTMLElement>('[data-toast-id]:last-child');
          if (target) {
            this.lastFocusedId = latest.id;
            target.focus();
          }
        } catch (err) {
          // avoid noisy logs in production while keeping debug visibility during dev
          console.debug('toast focus error', err);
        }
      });
    });
  }

  handleEscape(event: Event): void {
    const e = event as KeyboardEvent;
    if (e.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
