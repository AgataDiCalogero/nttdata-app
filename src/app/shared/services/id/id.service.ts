import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IdService {
  readonly counters = new Map<string, number>();

  /**
   * Return a deterministic incremental id scoped by prefix.
   * Example: id('search') -> 'search-1', 'search-2', ...
   */
  next(prefix = 'id'): string {
    const current = this.counters.get(prefix) ?? 0;
    const next = current + 1;
    this.counters.set(prefix, next);
    return `${prefix}-${next}`;
  }

  /**
   * Reset counters (useful in tests)
   */
  reset(prefix?: string): void {
    if (prefix != null && prefix !== '') {
      this.counters.delete(prefix);
    } else {
      this.counters.clear();
    }
  }
}
