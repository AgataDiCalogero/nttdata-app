import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { LucideAngularModule, Trash2, Pencil } from 'lucide-angular';
import { DebounceInputDirective } from '@app/shared/directives/debounce-input.directive';
import { UsersApiService } from '@app/services/users/users-api.service';
import type { User } from '@app/models';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { UserForm } from './user-form/user-form.component';
import {
  DeleteConfirmComponent,
  type DeleteConfirmData,
} from '../../../shared/dialog/delete-confirm/delete-confirm.component';

type SortField = 'name' | 'email' | 'status';

@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, RouterModule, LucideAngularModule, DebounceInputDirective],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private readonly api = inject(UsersApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(Dialog);

  readonly Trash2 = Trash2;
  readonly Pencil = Pencil;

  // base state
  private readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<number | null>(null);

  private readonly searchTerm = signal('');
  private readonly sortState = signal<{ field: SortField; dir: 1 | -1 }>({
    field: 'name',
    dir: 1,
  });
  private readonly pageState = signal<{ page: number; per_page: number }>({
    page: 1,
    per_page: 10,
  });

  private readonly filteredUsers = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const { field, dir } = this.sortState();
    const list = this.users();

    const filtered = query
      ? list.filter((user) => {
          const name = String(user.name ?? '').toLowerCase();
          const email = String(user.email ?? '').toLowerCase();
          return name.includes(query) || email.includes(query);
        })
      : [...list];

    return filtered.sort((a, b) => {
      const fa = String(a[field] ?? '').toLowerCase();
      const fb = String(b[field] ?? '').toLowerCase();
      if (fa < fb) return -1 * dir;
      if (fa > fb) return 1 * dir;
      return 0;
    });
  });

  readonly displayed = computed(() => {
    const { page, per_page } = this.pageState();
    const data = this.filteredUsers();
    const start = (page - 1) * per_page;
    const items = data.slice(start, start + per_page);

    return {
      items,
      total: data.length,
      page,
      per_page,
      totalPages: Math.max(1, Math.ceil(Math.max(data.length, 1) / per_page)),
    };
  });

  constructor() {
    const qp = this.route.snapshot.queryParamMap;
    const page = Number(qp.get('page') ?? 1) || 1;
    const perPage = Number(qp.get('per_page') ?? 10) || 10;
    this.pageState.set({
      page: Math.max(1, page),
      per_page: Math.max(1, perPage),
    });

    this.loadUsers();
  }

  sortDir(field: SortField): number {
    const sort = this.sortState();
    return sort.field === field ? sort.dir : 0;
  }

  currentPage(): { page: number; per_page: number } {
    return this.pageState();
  }

  totalPages(total: number): number {
    const perPage = this.pageState().per_page || 1;
    return Math.max(1, Math.ceil(total / perPage));
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.users.set(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error.set('Unable to load users');
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.searchTerm.set(value ?? '');
    const { per_page } = this.pageState();
    this.setPage(1, per_page, false);
  }

  toggleSort(field: SortField): void {
    const current = this.sortState();
    if (current.field === field) {
      this.sortState.set({ field, dir: current.dir === 1 ? -1 : 1 });
    } else {
      this.sortState.set({ field, dir: 1 });
    }
    this.setPage(1, this.pageState().per_page, false);
  }

  ariaSort(field: SortField): 'ascending' | 'descending' | 'none' {
    const { field: currentField, dir } = this.sortState();
    if (currentField !== field) {
      return 'none';
    }

    return dir === 1 ? 'ascending' : 'descending';
  }

  sortIndicator(field: SortField): 'asc' | 'desc' | null {
    const { field: currentField, dir } = this.sortState();
    if (currentField !== field) {
      return null;
    }

    return dir === 1 ? 'asc' : 'desc';
  }

  sortButtonLabel(field: SortField, label: string): string {
    const { field: currentField, dir } = this.sortState();
    const nextDir = currentField === field && dir === 1 ? 'descending' : 'ascending';
    return `Sort ${label} ${nextDir}`;
  }

  setPage(page: number, per_page: number, pushUrl = true): void {
    const perPage = Math.max(1, per_page);
    const totalPages = Math.max(1, Math.ceil(this.filteredUsers().length / perPage));
    const nextPage = Math.max(1, Math.min(page, totalPages));

    this.pageState.set({ page: nextPage, per_page: perPage });

    if (pushUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: nextPage, per_page: perPage },
        queryParamsHandling: 'merge',
      });
    }
  }

  trackById(_idx: number, user: User): number {
    return user.id;
  }

  openNewUserModal(): void {
    const isMobile = window.innerWidth < 640;
    const config = isMobile
      ? {
          position: { right: '0', top: '0' },
          height: '100%',
          width: '480px',
          maxWidth: '100vw',
          panelClass: 'slide-in-drawer',
          backdropClass: 'blurred-backdrop',
          ariaLabel: 'New user',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        }
      : {
          width: '600px',
          maxWidth: '90vw',
          backdropClass: 'blurred-backdrop',
          panelClass: 'user-form-modal',
          ariaLabel: 'New user',
          autoFocus: true,
          restoreFocus: true,
          closeOnNavigation: true,
          disableClose: false,
        };

    const ref = this.dialog.open(UserForm, config);
    ref.closed.subscribe((result) => {
      if (result === 'success') {
        this.loadUsers();
      }
    });
  }

  openEditUserModal(userId: number): void {
    this.api.getById(userId).subscribe({
      next: (user) => {
        const isMobile = window.innerWidth < 640;
        const config = isMobile
          ? {
              position: { right: '0', top: '0' },
              height: '100%',
              width: '480px',
              maxWidth: '100vw',
              panelClass: 'slide-in-drawer',
              backdropClass: 'blurred-backdrop',
              ariaLabel: 'Edit user',
              autoFocus: true,
              restoreFocus: true,
              closeOnNavigation: true,
              disableClose: false,
              data: { user },
            }
          : {
              width: '600px',
              maxWidth: '90vw',
              backdropClass: 'blurred-backdrop',
              panelClass: 'user-form-modal',
              ariaLabel: 'Edit user',
              autoFocus: true,
              restoreFocus: true,
              closeOnNavigation: true,
              disableClose: false,
              data: { user },
            };

        const ref = this.dialog.open(UserForm, config);
        ref.closed.subscribe((result) => {
          if (result === 'success') {
            this.loadUsers();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load user for edit:', err);
        this.toast.show('error', 'Unable to load user');
      },
    });
  }

  onDelete(user: User): void {
    const data: DeleteConfirmData = {
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    };

    const ref = this.dialog.open(DeleteConfirmComponent, {
      width: '400px',
      maxWidth: '90vw',
      backdropClass: 'blurred-backdrop',
      panelClass: 'user-form-modal',
      ariaLabel: 'Delete user confirmation',
      autoFocus: true,
      restoreFocus: true,
      data,
    });

    ref.closed.subscribe((confirmed) => {
      if (!confirmed) return;

      this.deletingId.set(user.id);
      this.api.delete(user.id).subscribe({
        next: () => {
          this.users.update((list) => list.filter((item) => item.id !== user.id));
          this.deletingId.set(null);
          this.toast.show('success', 'User deleted');
          const { per_page } = this.pageState();
          this.setPage(this.pageState().page, per_page, false);
        },
        error: (err) => {
          console.error('Delete failed:', err);
          this.deletingId.set(null);
          this.toast.show('error', 'Unable to delete user');
        },
      });
    });
  }
}
