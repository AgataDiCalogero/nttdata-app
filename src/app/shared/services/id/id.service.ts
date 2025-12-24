import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdService {
  readonly counters = new Map<string, number>();

  next(prefix = 'id'): string {
    const current = this.counters.get(prefix) ?? 0;
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}-${next}`;
  }

  reset(prefix?: string): void {
    if (prefix != null && prefix !== '') {
      this.counters.delete(prefix);
    } else {
      this.counters.clear();
    }
  }
}
