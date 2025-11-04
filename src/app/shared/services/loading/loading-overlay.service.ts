import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingOverlayService {
  private readonly _pending = signal(0);

  readonly isLoading = computed(() => this._pending() > 0);

  show(): void {
    this._pending.update((value) => value + 1);
  }

  hide(): void {
    this._pending.update((value) => (value > 0 ? value - 1 : 0));
  }
}
