import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, of, shareReplay, tap, throwError, type Observable } from 'rxjs';

import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { User } from '@/app/shared/models/user';

@Injectable({ providedIn: 'root' })
export class UsersLookupService {
  private readonly usersApi = inject(UsersApiService);
  private readonly cache = signal<User[]>([]);
  private readonly loading = signal(false);
  private readonly lastFetchedAt = signal<number | null>(null);
  private inFlight: Observable<User[]> | null = null;
  private readonly ttlMs = 5 * 60 * 1000;

  readonly users = computed(() => this.cache());
  readonly userLookup = computed(() =>
    this.cache().reduce<Record<number, User | undefined>>((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {}),
  );
  readonly isLoading = computed(() => this.loading());

  ensureUsersLoaded(options?: { force?: boolean; perPage?: number }): Observable<User[]> {
    const isForce = options?.force === true;
    if (!isForce && this.cache().length > 0 && !this.isExpired()) {
      return of(this.cache());
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    const perPage = options?.perPage ?? 50;
    this.loading.set(true);
    const request$ = this.usersApi.list({ perPage }, { cache: true }).pipe(
      map((resp) => resp.items),
      tap((list) => {
        this.mergeUsers(list);
        this.lastFetchedAt.set(Date.now());
        this.loading.set(false);
        this.inFlight = null;
      }),
      catchError((err: unknown) => {
        this.loading.set(false);
        this.inFlight = null;
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.inFlight = request$;
    return request$;
  }

  ensureUserInCache(id: number): Observable<User> {
    const existing = this.userLookup()[id];
    if (existing) {
      return of(existing);
    }
    this.loading.set(true);
    return this.usersApi.getById(id).pipe(
      tap((user) => {
        this.mergeUsers([user]);
        this.lastFetchedAt.set(Date.now());
        this.loading.set(false);
      }),
      catchError((err: unknown) => {
        this.loading.set(false);
        return throwError(() => err);
      }),
    );
  }

  seed(users: User[]): void {
    if (users.length === 0) return;
    this.mergeUsers(users);
  }

  clear(): void {
    this.cache.set([]);
    this.lastFetchedAt.set(null);
  }

  private mergeUsers(users: User[]): void {
    if (users.length === 0) {
      return;
    }
    const incoming = new Map<number, User>();
    for (const user of users) {
      incoming.set(user.id, user);
    }
    this.cache.update((current) => {
      const combined = new Map<number, User>();
      for (const user of current) {
        combined.set(user.id, user);
      }
      for (const user of incoming.values()) {
        combined.set(user.id, user);
      }
      return Array.from(combined.values());
    });
  }

  private isExpired(): boolean {
    const ts = this.lastFetchedAt();
    if (ts === null) return true;
    return Date.now() - ts > this.ttlMs;
  }
}
