import { Injectable } from '@angular/core';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheOptions {
  ttl?: number;
}

@Injectable({
  providedIn: 'root',
})
export class QueryCacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL = 60 * 1000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(keyPrefixOrPredicate: string | ((key: string) => boolean)): void {
    if (typeof keyPrefixOrPredicate === 'string') {
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPrefixOrPredicate)) {
          this.cache.delete(key);
        }
      }
    } else {
      for (const key of this.cache.keys()) {
        if (keyPrefixOrPredicate(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}
