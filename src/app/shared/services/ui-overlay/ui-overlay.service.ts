import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type OverlayKey =
  | 'appearance-menu'
  | 'token-help-dialog'
  | 'user-form'
  | 'user-delete-confirm'
  | 'post-form'
  | 'post-delete-confirm'
  | 'comment-delete-confirm'
  | 'post-comments'
  | 'language-menu';

interface OverlayHandle {
  key: OverlayKey;
  close: () => void;
  blockGlobalControls?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UiOverlayService {
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly activeOverlay = signal<OverlayHandle | null>(null);

  activate(handle: OverlayHandle): void {
    const current = this.activeOverlay();
    if (current?.key === handle.key) {
      this.activeOverlay.set(handle);
      this.syncGlobalState(handle);
      return;
    }

    current?.close();
    this.activeOverlay.set(handle);
    this.syncGlobalState(handle);
  }

  release(key: OverlayKey): void {
    const current = this.activeOverlay();
    if (!current || current.key !== key) {
      return;
    }

    this.activeOverlay.set(null);
    this.syncGlobalState(null);
  }

  isActive(key: OverlayKey): boolean {
    return this.activeOverlay()?.key === key;
  }

  closeActive(): void {
    const current = this.activeOverlay();
    if (!current) {
      return;
    }

    this.activeOverlay.set(null);
    this.syncGlobalState(null);
    current.close();
  }

  private syncGlobalState(handle: OverlayHandle | null): void {
    const doc = this.document;
    if (!doc?.body) {
      return;
    }

    const shouldBlock = Boolean(handle?.blockGlobalControls);
    doc.body.classList.toggle('ui-overlay-blocked', shouldBlock);

    if (shouldBlock && handle) {
      doc.body.dataset.uiOverlayKey = handle.key;
    } else {
      delete doc.body.dataset.uiOverlayKey;
    }
  }
}
