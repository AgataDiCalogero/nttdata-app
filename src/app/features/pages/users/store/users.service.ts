import type { Signal } from '@angular/core';
import type { User } from '@/app/shared/models';

export type SortField = 'name' | 'email' | 'status';

export interface UsersService {
  readonly users: Signal<User[]>;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly deletingId: Signal<number | null>;
  readonly searchTerm: Signal<string>;
  readonly sortState: Signal<{ field: SortField; dir: 1 | -1 }>;
  readonly pageState: Signal<{ page: number; per_page: number }>;

  readonly displayed: Signal<{
    items: User[];
    total: number;
    page: number;
    per_page: number;
    totalPages: number;
  }>;

  loadUsers(): void;
  onSearch(value: string): void;
  toggleSort(field: SortField): void;
  setPage(page: number, per_page: number, pushUrl?: boolean): void;
  onDelete(user: User): void;
  openNewUserModal(): void;
  openEditUserModal(userId: number): void;
}
