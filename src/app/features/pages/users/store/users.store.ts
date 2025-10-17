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

// Definisci il tipo per lo state interno (solo ciò che serve per il funzionamento, non pubblico)
interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  deletingId: number | null;
  searchTerm: string;
  sortState: { field: SortField; dir: 1 | -1 };
  pageState: { page: number; per_page: number };
}

// Crea l'adapter Signal Store
export const UsersStoreAdapter = signalStore(
  // Stato iniziale generico
  withState<UsersState>({
    users: [],
    loading: true,
    error: null,
    deletingId: null,
    searchTerm: '',
    sortState: { field: 'name', dir: 1 },
    pageState: { page: 1, per_page: 10 },
  }),

  // Computed per derived state
  withComputed((store) => ({
    displayed: computed(() => {
      const { page, per_page } = store.pageState();
      // Compute filtered users locally
      const query = store.searchTerm().trim().toLowerCase();
      const { field, dir } = store.sortState();
      const list = store.users();
      const filtered = query
        ? list.filter((user) => {
            const name = String(user.name ?? '').toLowerCase();
            const email = String(user.email ?? '').toLowerCase();
            return name.includes(query) || email.includes(query);
          })
        : [...list];
      const sorted = [...filtered].sort((a, b) => {
        const fa = String(a[field] ?? '').toLowerCase();
        const fb = String(b[field] ?? '').toLowerCase();
        if (fa < fb) return -1 * dir;
        if (fa > fb) return 1 * dir;
        return 0;
      });
      const data = sorted;
      const start = (page - 1) * per_page;
      const items = data.slice(start, start + per_page);

      return {
        items,
        total: data.length,
        page,
        per_page,
        totalPages: Math.max(1, Math.ceil(Math.max(data.length, 1) / per_page)),
      };
    }),
  })),

  // Methods per tutte le operazioni
  withMethods((store) => {
    const usersApi = inject(UsersApiService);
    const toast = inject(ToastService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const dialog = inject(Dialog);

    // Setup iniziale
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
      const perPage = Math.max(1, per_page);
      // Compute filtered users locally
      const query = store.searchTerm().trim().toLowerCase();
      const { field, dir } = store.sortState();
      const list = store.users();
      const filtered = query
        ? list.filter((user) => {
            const name = String(user.name ?? '').toLowerCase();
            const email = String(user.email ?? '').toLowerCase();
            return name.includes(query) || email.includes(query);
          })
        : [...list];
      const sorted = [...filtered].sort((a, b) => {
        const fa = String(a[field] ?? '').toLowerCase();
        const fb = String(b[field] ?? '').toLowerCase();
        if (fa < fb) return -1 * dir;
        if (fa > fb) return 1 * dir;
        return 0;
      });
      const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
      const nextPage = Math.max(1, Math.min(page, totalPages));

      patchState(store, {
        pageState: { page: nextPage, per_page: perPage },
      });

      if (pushUrl) {
        router.navigate([], {
          relativeTo: route,
          queryParams: { page: nextPage, per_page: perPage },
          queryParamsHandling: 'merge',
        });
      }
    };

    const openNewUserModal = () => {
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

      const ref = dialog.open(UserForm, config);
      ref.closed.subscribe((result) => {
        if (result === 'success') {
          loadUsers();
        }
      });
    };

    const openEditUserModal = (userId: number) => {
      usersApi.getById(userId).subscribe({
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

          const ref = dialog.open(UserForm, config);
          ref.closed.subscribe((result) => {
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
      };

      const ref = dialog.open(DeleteConfirmComponent, {
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
        handleDeleteConfirmed(user.id);
      });
    };

    const handleDeleteConfirmed = (userId: number) => {
      patchState(store, { deletingId: userId });
      usersApi.delete(userId).subscribe({
        next: () => {
          const updatedUsers = store.users().filter((item) => item.id !== userId);
          patchState(store, {
            users: updatedUsers,
            deletingId: null,
          });
          toast.show('success', 'User deleted');
          const { per_page } = store.pageState();
          setPage(store.pageState().page, per_page, false);
        },
        error: (err) => {
          console.error('Delete failed:', err);
          patchState(store, { deletingId: null });
          toast.show('error', mapHttpError(err).message);
        },
      });
    };

    // Inizializza
    setupInitialState();

    return {
      // Signals pubblici (esposti dal port)
      users: store.users,
      loading: store.loading,
      error: store.error,
      deletingId: store.deletingId,
      searchTerm: store.searchTerm,
      sortState: store.sortState,
      pageState: store.pageState,

      // Computed pubblici
      displayed: store.displayed,

      // Methods pubblici
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
