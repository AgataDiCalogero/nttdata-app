import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject } from '@angular/core';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  imports: [TranslatePipe],
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
  readonly toasts = this.toastService.messages;

  get ariaLive(): 'polite' | 'assertive' {
    return this.toasts().some((toast) => toast.type === 'error') ? 'assertive' : 'polite';
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  handleEscape(event: Event): void {
    const e = event as KeyboardEvent;
    if (!this.isBrowser || e.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
