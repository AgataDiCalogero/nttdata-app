import { inject, computed, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import type { User, DeleteConfirmData } from '@/app/shared/models';
import type { SortField, UsersService } from './users.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { Dialog } from '@angular/cdk/dialog';
import { UserForm } from '../user-form/user-form.component';
import { DeleteConfirmComponent } from '../../../../shared/dialog/delete-confirm/delete-confirm.component';
import { mapHttpError } from '@/app/shared/utils/error-mapper';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { tap, take } from 'rxjs';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';

interface SortState {
  field: SortField;
  dir: 1 | -1;
}

interface PageState {
  page: number;
  per_page: number;
}

interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  per_page: number;
  totalPages: number;
}

function buildPaginatedUsers(
  users: User[],
  searchTerm: string,
  sortState: SortState,
  pageState: PageState,
): PaginatedUsers {
  const query = searchTerm.trim().toLowerCase();
  const filtered = query
    ? users.filter((user) => {
        const name = String(user.name ?? '').toLowerCase();
        const email = String(user.email ?? '').toLowerCase();
        return name.includes(query) || email.includes(query);
      })
    : [...users];

  const sorted = filtered.sort((a, b) => {
    const fa = String(a[sortState.field] ?? '').toLowerCase();
    const fb = String(b[sortState.field] ?? '').toLowerCase();
    if (fa < fb) return -1 * sortState.dir;
    if (fa > fb) return 1 * sortState.dir;
    return 0;
  });

  const perPage = Math.max(1, pageState.per_page);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(total, 1) / perPage));
  const safePage = Math.max(1, Math.min(pageState.page, totalPages));
  const start = (safePage - 1) * perPage;
  const items = sorted.slice(start, start + perPage);

  return {
    items,
    total,
    page: safePage,
    per_page: perPage,
    totalPages,
  };
}

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  deletingId: number | null;
  searchTerm: string;
  sortState: { field: SortField; dir: 1 | -1 };
  pageState: { page: number; per_page: number };
}

export const UsersStoreAdapter = signalStore(
  withState<UsersState>({
    users: [],
    loading: true,
    error: null,
    deletingId: null,
    searchTerm: '',
    sortState: { field: 'name', dir: 1 },
    pageState: { page: 1, per_page: 10 },
  }),

  withComputed((store) => ({
    displayed: computed(() =>
      buildPaginatedUsers(store.users(), store.searchTerm(), store.sortState(), store.pageState()),
    ),
  })),

  withMethods((store) => {
    const usersApi = inject(UsersApiService);
    const toast = inject(ToastService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const dialog = inject(Dialog);
    const dialogLayouts = inject(ResponsiveDialogService);
    const overlays = inject(UiOverlayService);

    const setupInitialState = () => {
      const qp = route.snapshot.queryParamMap;
      const page = Number(qp.get('page') ?? 1) || 1;
      const perPage = Number(qp.get('per_page') ?? 10) || 10;
      patchState(store, {
        pageState: {
          page: Math.max(1, page),
          per_page: Math.max(1, perPage),
        },
      });
      loadUsers();
    };

    const loadUsers = () => {
      patchState(store, { loading: true, error: null });
      usersApi.list().subscribe({
        next: ({ items }) => {
          patchState(store, {
            users: items ?? [],
            loading: false,
          });
          setPage(store.pageState().page, store.pageState().per_page, false);
        },
        error: (err) => {
          console.error('Failed to load users:', err);
          patchState(store, { error: mapHttpError(err).message, loading: false });
        },
      });
    };

    const onSearch = (value: string) => {
      patchState(store, { searchTerm: value ?? '' });
      setPage(1, store.pageState().per_page, false);
    };

    const toggleSort = (field: SortField) => {
      const current = store.sortState();
      if (current.field === field) {
        patchState(store, {
          sortState: { field, dir: current.dir === 1 ? -1 : 1 },
        });
      } else {
        patchState(store, { sortState: { field, dir: 1 } });
      }
      setPage(1, store.pageState().per_page, false);
    };

    const setPage = (page: number, per_page: number, pushUrl = true) => {
      const next = buildPaginatedUsers(store.users(), store.searchTerm(), store.sortState(), {
        page,
        per_page,
      });

      patchState(store, {
        pageState: { page: next.page, per_page: next.per_page },
      });

      if (pushUrl) {
        router.navigate([], {
          relativeTo: route,
          queryParams: { page: next.page, per_page: next.per_page },
          queryParamsHandling: 'merge',
        });
      }
    };

    const openNewUserModal = () => {
      const config = dialogLayouts.form<void, 'success' | 'cancel', UserForm>({
        ariaLabel: 'New user',
        desktop: { width: '37.5rem' },
      });
      const ref = dialog.open<'success' | 'cancel', void, UserForm>(UserForm, config);
      overlays.activate({
        key: 'user-form',
        close: () => ref.close(),
        blockGlobalControls: true,
      });
      ref.closed.pipe(take(1)).subscribe((result) => {
        overlays.release('user-form');
        if (result === 'success') {
          loadUsers();
        }
      });
    };

    const openEditUserModal = (userId: number) => {
      usersApi.getById(userId).subscribe({
        next: (user) => {
          const config = dialogLayouts.form<{ user: User }, 'success' | 'cancel', UserForm>({
            ariaLabel: 'Edit user',
            desktop: { width: '37.5rem' },
            data: { user },
          });
          const ref = dialog.open<'success' | 'cancel', { user: User }, UserForm>(UserForm, config);
          overlays.activate({
            key: 'user-form',
            close: () => ref.close(),
            blockGlobalControls: true,
          });
          ref.closed.pipe(take(1)).subscribe((result) => {
            overlays.release('user-form');
            if (result === 'success') {
              loadUsers();
            }
          });
        },
        error: (err) => {
          console.error('Failed to load user for edit:', err);
          toast.show('error', mapHttpError(err).message);
        },
      });
    };

    const onDelete = (user: User) => {
      const data: DeleteConfirmData = {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        inProgressText: 'Deleting...',
        errorMessage: 'Unable to delete user right now. Please try again.',
        confirmAction: () => {
          patchState(store, { deletingId: user.id });

          return usersApi.delete(user.id).pipe(
            tap({
              next: () => {
                const updatedUsers = store.users().filter((item) => item.id !== user.id);
                patchState(store, {
                  users: updatedUsers,
                  deletingId: null,
                });
                toast.show('success', 'User deleted');
                const { page, per_page } = store.pageState();
                setPage(page, per_page, false);
              },
              error: (err) => {
                console.error('Delete failed:', err);
                patchState(store, { deletingId: null });
                const mapped = mapHttpError(err);
                toast.show('error', mapped.message);
                throw new Error(mapped.message);
              },
            }),
          );
        },
      };

      const ref = dialog.open(DeleteConfirmComponent, {
        width: '25rem',
        maxWidth: '90vw',
        backdropClass: 'app-dialog-overlay',
        panelClass: 'app-dialog-panel',
        ariaLabel: 'Delete user confirmation',
        autoFocus: true,
        restoreFocus: true,
        data,
      });
      overlays.activate({
        key: 'user-delete-confirm',
        close: () => ref.close(),
        blockGlobalControls: true,
      });
      ref.closed.pipe(take(1)).subscribe(() => {
        overlays.release('user-delete-confirm');
      });
    };

    setupInitialState();

    return {
      loadUsers,
      onSearch,
      toggleSort,
      setPage,
      openNewUserModal,
      openEditUserModal,
      onDelete,
    };
  }),
) satisfies Type<UsersService>;
