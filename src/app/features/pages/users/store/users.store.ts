import { inject, computed, Type, DestroyRef, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import type { User, DeleteConfirmData, PaginationMeta } from '@/app/shared/models';
import type { SortField, UsersService } from './users.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { Dialog } from '@angular/cdk/dialog';
import { UserForm } from '../user-form/user-form.component';
import { DeleteConfirmComponent } from '../../../../shared/dialog/delete-confirm/delete-confirm.component';
import { mapHttpError } from '@/app/shared/utils/error-mapper';
import { ResponsiveDialogService } from '@/app/shared/services/dialog/responsive-dialog.service';
import { tap, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiOverlayService } from '@app/shared/services/ui-overlay/ui-overlay.service';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';

interface SortState {
  field: SortField;
  dir: 1 | -1;
}

interface UsersState {
  items: User[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  deletingId: number | null;
  searchTerm: string;
  sortState: SortState;
  page: number;
  perPage: number;
  perPageOptions: readonly number[];
}

interface LoadUsersOptions {
  page?: number;
  perPage?: number;
  searchTerm?: string;
  pushUrl?: boolean;
}

const normalizePage = (value: number | undefined, fallback: number) =>
  Math.max(1, Number.isFinite(value as number) ? Math.floor(value as number) : fallback);

export const UsersStoreAdapter = signalStore(
  withState<UsersState>({
    items: [],
    pagination: null,
    loading: true,
    error: null,
    deletingId: null,
    searchTerm: '',
    sortState: { field: 'name', dir: 1 },
    page: 1,
    perPage: 10,
    perPageOptions: [10, 20, 50],
  }),

  withComputed((store) => ({
    users: computed(() => {
      const { field, dir } = store.sortState();

      const getValue = (u: User) => {
        const v = u[field]; // SortField ⊂ keyof User → ok per TS
        const s = typeof v === 'string' ? v : String(v ?? '');
        return s.toLowerCase();
      };

      return store
        .items()
        .slice()
        .sort((a, b) => {
          const av = getValue(a);
          const bv = getValue(b);
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
    }),
  })),

  withMethods((store) => {
    const usersApi = inject(UsersApiService);
    const destroyRef = inject(DestroyRef);
    const toast = inject(ToastService);
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const dialog = inject(Dialog);
    const dialogLayouts = inject(ResponsiveDialogService);
    const overlays = inject(UiOverlayService);
    const platformId = inject(PLATFORM_ID);
    const auth = inject(AuthService);
    const isBrowser = isPlatformBrowser(platformId);
    let bootstrapped = false;

    const loadUsers = (options: LoadUsersOptions = {}) => {
      const pushUrl = options.pushUrl ?? true;
      const targetPage = normalizePage(options.page, store.page());
      const targetPerPage = normalizePage(options.perPage, store.perPage());
      const term = (options.searchTerm ?? store.searchTerm()).trim();

      const token = auth.token();
      if (!token || !token.trim()) {
        patchState(store, {
          loading: false,
          error: null,
          searchTerm: term,
        });
        return;
      }

      patchState(store, {
        loading: true,
        error: null,
        searchTerm: term,
      });

      const params: {
        page: number;
        per_page: number;
        name?: string;
        email?: string;
      } = {
        page: targetPage,
        per_page: targetPerPage,
      };

      if (term) {
        params.name = term;
        if (term.includes('@')) {
          params.email = term;
        }
      }

      usersApi
        .list(params)
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe({
          next: ({ items, pagination }) => {
            const resolvedLimit = Math.max(1, pagination?.limit ?? targetPerPage);
            const resolvedTotal = pagination?.total ?? items.length;
            const resolvedPages =
              pagination?.pages ??
              (resolvedTotal ? Math.ceil(Math.max(resolvedTotal, 1) / resolvedLimit) : 1);
            const resolvedPage = Math.min(
              Math.max(1, pagination?.page ?? targetPage),
              Math.max(1, resolvedPages),
            );

            const meta: PaginationMeta = {
              total: resolvedTotal,
              pages: Math.max(1, resolvedPages),
              page: resolvedPage,
              limit: resolvedLimit,
            };

            patchState(store, {
              items: items ?? [],
              pagination: meta,
              loading: false,
              page: meta.page,
              perPage: meta.limit,
            });

            if (pushUrl) {
              router.navigate([], {
                relativeTo: route,
                queryParams: {
                  page: meta.page,
                  per_page: meta.limit,
                  search: term || null,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
            }

            if (!items.length && meta.total > 0 && meta.page > meta.pages) {
              loadUsers({ page: meta.pages, perPage: meta.limit, searchTerm: term, pushUrl });
            }
          },
          error: (err) => {
            console.error('Failed to load users:', err);
            patchState(store, {
              loading: false,
              error: mapHttpError(err).message,
            });
          },
        });
    };

    const setupInitialState = () => {
      const qp = route.snapshot.queryParamMap;
      const initialPage = normalizePage(Number(qp.get('page')), store.page());
      const initialPerPage = normalizePage(Number(qp.get('per_page')), store.perPage());
      const initialSearch = (qp.get('search') ?? '').trim();

      patchState(store, {
        page: initialPage,
        perPage: initialPerPage,
        searchTerm: initialSearch,
      });

      loadUsers({
        page: initialPage,
        perPage: initialPerPage,
        searchTerm: initialSearch,
        pushUrl: false,
      });
    };

    const initializeBootstrap = () => {
      if (!isBrowser) {
        patchState(store, { loading: false });
        return;
      }

      const attempt = () => {
        if (bootstrapped) {
          return;
        }
        const token = auth.token();
        if (!token || !token.trim()) {
          return;
        }
        bootstrapped = true;
        setupInitialState();
      };

      attempt();

      effect(() => {
        const token = auth.token();
        if (token && token.trim()) {
          attempt();
        } else if (bootstrapped) {
          bootstrapped = false;
          patchState(store, {
            items: [],
            pagination: null,
            loading: false,
            error: null,
            deletingId: null,
          });
        }
      });
    };

    const onSearch = (value: string) => {
      loadUsers({ page: 1, perPage: store.perPage(), searchTerm: value ?? '', pushUrl: true });
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
    };

    const setPage = (page: number) => {
      loadUsers({ page, perPage: store.perPage(), pushUrl: true });
    };

    const setPerPage = (perPage: number) => {
      loadUsers({ page: 1, perPage, pushUrl: true });
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
          loadUsers({ pushUrl: false });
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
              loadUsers({ pushUrl: false });
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
                patchState(store, { deletingId: null });
                toast.show('success', 'User deleted');
                loadUsers({ pushUrl: false });
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

    initializeBootstrap();

    return {
      loadUsers,
      onSearch,
      toggleSort,
      setPage,
      setPerPage,
      openNewUserModal,
      openEditUserModal,
      onDelete,
    };
  }),
) satisfies Type<UsersService>;
