import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
  ttl: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messagesSignal = signal<ToastMessage[]>([]);
  readonly messages = this.messagesSignal.asReadonly();

  show(type: ToastType, text: string, ttl = 3000): void {
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const toast: ToastMessage = { id, type, text, ttl };
    this.messagesSignal.update((messages) => [
      ...messages.filter((message) => message.type !== type || message.text !== text),
      toast,
    ]);

    setTimeout(() => this.dismiss(id), ttl);
  }

  dismiss(id: string): void {
    this.messagesSignal.set(this.messagesSignal().filter((toast) => toast.id !== id));
  }

  clear(): void {
    this.messagesSignal.set([]);
  }
}
