import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { UsersApiService } from './services/users-api-service';
import type { User } from '@app/models';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { BehaviorSubject, combineLatest, debounceTime, map } from 'rxjs';
import { ToastService } from '../../../shared/toast/toast.service';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { UserForm } from './user-form/user-form';

// Users management page component
@Component({
  standalone: true,
  selector: 'app-users',
  imports: [CommonModule, RouterModule, AsyncPipe, LucideAngularModule, ToastComponent],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  private api = inject(UsersApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  private dialog = inject(Dialog);

  // data source
  private usersSubject = new BehaviorSubject<User[]>([]);

  // UI states
  loading = signal(true);
  error = signal<string | null>(null);
  deletingId = signal<number | null>(null);

  // controls
  private searchTerm = new BehaviorSubject<string>('');
  private sortState = new BehaviorSubject<{ field: 'name' | 'email' | 'status'; dir: 1 | -1 }>({
    field: 'name',
    dir: 1,
  });
  private pageState = new BehaviorSubject<{ page: number; per_page: number }>({
    page: 1,
    per_page: 10,
  });

  // exposed
  readonly Trash2 = Trash2;

  // displayed observable: filter, sort, paginate
  displayed$ = combineLatest({
    users: this.usersSubject,
    q: this.searchTerm.pipe(debounceTime(300)),
    sort: this.sortState,
    page: this.pageState,
  }).pipe(
    map(({ users, q, sort, page }) => {
      // filter
      const qq = q.trim().toLowerCase();
      let filtered = users.filter((u) => {
        if (!qq) return true;
        return (
          String(u.name).toLowerCase().includes(qq) || String(u.email).toLowerCase().includes(qq)
        );
      });

      // sort
      filtered = filtered.sort((a, b) => {
        const fa = String(a[sort.field] ?? '').toLowerCase();
        const fb = String(b[sort.field] ?? '').toLowerCase();
        if (fa < fb) return -1 * sort.dir;
        if (fa > fb) return 1 * sort.dir;
        return 0;
      });

      // pagination
      const total = filtered.length;
      const start = (page.page - 1) * page.per_page;
      const end = start + page.per_page;
      const pageItems = filtered.slice(start, end);

      return { items: pageItems, total };
    }),
  );

  constructor() {
    // read query params initial
    const qp = this.route.snapshot.queryParamMap;
    const p = Number(qp.get('page') ?? 1) || 1;
    const per = Number(qp.get('per_page') ?? 10) || 10;
    this.pageState.next({ page: p, per_page: per });

    this.loadUsers();

    // Deep-link: check for ?modal=new or ?modal=edit&id=X
    const modalType = qp.get('modal');
    if (modalType === 'new') {
      // Open new user modal
      setTimeout(() => this.openNewUserModal(), 0);
    } else if (modalType === 'edit') {
      const editId = qp.get('id');
      if (editId) {
        const userId = Number(editId);
        if (!Number.isNaN(userId)) {
          setTimeout(() => this.openEditUserModal(userId), 0);
        }
      }
    }
  }

  // helpers for template
  sortDir(field: 'name' | 'email' | 'status'): number {
    const s = this.sortState.getValue();
    return s.field === field ? s.dir : 0;
  }

  currentPage(): { page: number; per_page: number } {
    return this.pageState.getValue();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: (list) => {
        this.usersSubject.next(list ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.error.set('Impossibile caricare gli utenti');
        this.loading.set(false);
      },
    });
  }

  totalPages(total: number): number {
    const p = this.pageState.getValue();
    return Math.max(1, Math.ceil(total / p.per_page));
  }

  trackById(_idx: number, item: User): number {
    return item.id;
  }

  // search input handler
  onSearch(v: string): void {
    this.searchTerm.next(v ?? '');
    // reset to first page
    const s = this.pageState.getValue();
    this.setPage(1, s.per_page, false);
  }

  // sorting
  toggleSort(field: 'name' | 'email' | 'status') {
    const cur = this.sortState.getValue();
    if (cur.field === field) {
      this.sortState.next({ field, dir: cur.dir === 1 ? -1 : 1 });
    } else {
      this.sortState.next({ field, dir: 1 });
    }
  }

  // pagination - also update query params
  setPage(page: number, per_page: number, pushUrl = true) {
    this.pageState.next({ page, per_page });
    if (pushUrl) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page, per_page },
        queryParamsHandling: 'merge',
      });
    }
  }

  // open New User modal
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
      // Remove modal query param while preserving others (page, per_page, q, sort)
      this.removeModalQueryParam();

      if (result === 'success') {
        this.loadUsers();
      }
    });
  }

  // open Edit User modal
  openEditUserModal(userId: number): void {
    // Load user data first
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
          // Remove modal query param while preserving others
          this.removeModalQueryParam();

          if (result === 'success') {
            this.loadUsers();
          }
        });
      },
      error: (err) => {
        console.error('Failed to load user for edit:', err);
        this.toast.show('error', 'Unable to load user');
        this.removeModalQueryParam();
      },
    });
  }

  // Helper to remove modal query param while preserving others
  private removeModalQueryParam(): void {
    const currentParams = this.route.snapshot.queryParamMap;
    const preserved: Record<string, string> = {};

    // Preserve all params except 'modal' and 'id' (if it was for modal)
    currentParams.keys.forEach((key) => {
      if (key !== 'modal' && !(key === 'id' && currentParams.get('modal'))) {
        const val = currentParams.get(key);
        if (val !== null) preserved[key] = val;
      }
    });

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: preserved,
      replaceUrl: true,
    });
  }

  // delete with confirm + toast
  onDelete(u: User): void {
    const ok = confirm(`Delete ${u.name}?`);
    if (!ok) return;
    this.deletingId.set(u.id);
    this.api.delete(u.id).subscribe({
      next: () => {
        // remove locally
        const current = this.usersSubject.getValue();
        this.usersSubject.next(current.filter((x) => x.id !== u.id));
        this.deletingId.set(null);
        this.toast.show('success', 'User deleted');
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deletingId.set(null);
        this.toast.show('error', 'Unable to delete user');
      },
    });
  }
}
