import type { Signal } from '@angular/core';

import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { User } from '@/app/shared/models/user';

export type SortField = Extract<keyof User, 'name' | 'email' | 'role' | 'createdAt'>;

export interface UsersService {
  readonly users: Signal<User[]>;
  readonly pagination: Signal<PaginationMeta | null>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly deletingId: Signal<number | null>;
  readonly searchTerm: Signal<string>;
  readonly sortState: Signal<{ field: SortField; dir: 1 | -1 }>;
  readonly page: Signal<number>;
  readonly perPage: Signal<number>;
  readonly perPageOptions: Signal<readonly number[]>;

  loadUsers(options?: {
    page?: number;
    perPage?: number;
    searchTerm?: string;
    pushUrl?: boolean;
    forceReload?: boolean;
  }): void;
  onSearch(value: string): void;
  resetFilters(): void;
  toggleSort(field: SortField): void;
  setPage(page: number): void;
  setPerPage(perPage: number): void;
  setDeleting(userId: number | null): void;
  updateStatus(userId: number, status: 'active' | 'inactive'): void;
}
