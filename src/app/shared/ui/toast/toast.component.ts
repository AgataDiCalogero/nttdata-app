import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  afterNextRender,
  effect,
  inject,
} from '@angular/core';

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
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private lastFocusedId: string | null = null;
  readonly toasts = this.toastService.messages;

  @ViewChildren('toastItem', { read: ElementRef })
  private readonly toastItems?: QueryList<ElementRef<HTMLElement>>;

  get ariaLive(): 'polite' | 'assertive' {
    return this.toasts().some((toast) => toast.type === 'error') ? 'assertive' : 'polite';
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  constructor() {
    effect(() => {
      if (!this.isBrowser || !this.document) {
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

      afterNextRender(
        () => {
          try {
            const items = this.toastItems?.toArray() ?? [];
            const target =
              items.find((ref) => ref.nativeElement.getAttribute('data-toast-id') === latest.id)
                ?.nativeElement ?? items.at(-1)?.nativeElement;
            if (target) {
              this.lastFocusedId = latest.id;
              target.focus();
            }
          } catch (err) {
            console.debug('toast focus error', err);
          }
        },
        { injector: this.injector },
      );
    });
  }

  handleEscape(event: Event): void {
    const e = event as KeyboardEvent;
    if (!this.isBrowser || e.defaultPrevented || this.toasts().length === 0) {
      return;
    }

    this.toastService.clear();
  }
}
