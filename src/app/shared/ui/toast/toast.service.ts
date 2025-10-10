import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _messages = signal<ToastMessage[]>([]);
  messages = this._messages.asReadonly();

  show(type: ToastType, text: string, ttl = 3000) {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
    const m: ToastMessage = { id, type, text };
    this._messages.set([...this._messages(), m]);
    setTimeout(() => this.dismiss(id), ttl);
  }

  dismiss(id: string) {
    this._messages.set(this._messages().filter((t) => t.id !== id));
  }
}
