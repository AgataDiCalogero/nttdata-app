import { isPlatformBrowser } from '@angular/common';
import { inject, computed, Type, DestroyRef, effect, PLATFORM_ID } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { User } from '@/app/shared/models/user';
import { mapHttpError } from '@/app/shared/utils/error-mapper';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import type { SortField, UsersService } from './users.service';

interface SortState {
  field: SortField;
  dir: 1 | -1;
}

interface UsersState {
  ids: number[];
  entities: Record<number, User>;
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

const findNearestPerPage = (
  value: number,
  options: readonly number[],
  fallback: number,
): number => {
  if (options.includes(value)) {
    return value;
  }
  if (options.includes(fallback)) {
    return fallback;
  }
  const sorted = options
    .filter((option) => Number.isFinite(option) && option > 0)
    .map((option) => Math.floor(option))
    .sort((a, b) => a - b);
  if (!sorted.length) {
    return Math.max(1, value, fallback);
  }
  const candidate = sorted.find((option) => option >= value) ?? sorted.at(-1);
  return candidate ?? fallback;
};

export const UsersStoreAdapter = signalStore(
  withState<UsersState>({
    ids: [],
    entities: {},
    pagination: null,
    loading: true,
    error: null,
    deletingId: null,
    searchTerm: '',
    sortState: { field: 'name', dir: 1 },
    page: DEFAULT_PAGINATION_CONFIG.defaultPage,
    perPage: DEFAULT_PAGINATION_CONFIG.defaultPerPage,
    perPageOptions: DEFAULT_PAGINATION_CONFIG.perPageOptions,
  }),

  withComputed((store) => ({
    users: computed(() => {
      const { field, dir } = store.sortState();
      const entities = store.entities();

      const getValue = (u: User) => {
        const v = u[field]; // SortField ⊂ keyof User → ok per TS
        const s = typeof v === 'string' ? v : String(v ?? '');
        return s.toLowerCase();
      };

      return store
        .ids()
        .map((id) => entities[id])
        .filter(Boolean)
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
    const router = inject(Router);
    const route = inject(ActivatedRoute);
    const platformId = inject(PLATFORM_ID);
    const auth = inject(AuthService);
    const notifications = inject(NotificationsService);
    const pagination =
      inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
      DEFAULT_PAGINATION_CONFIG;
    const isBrowser = isPlatformBrowser(platformId);
    let bootstrapped = false;

    patchState(store, {
      page: pagination.defaultPage,
      perPage: pagination.defaultPerPage,
      perPageOptions: pagination.perPageOptions,
    });

    const ensurePerPage = (value: number | undefined): number => {
      const normalized = normalizePage(value, pagination.defaultPerPage);
      const options = store.perPageOptions();
      return findNearestPerPage(normalized, options, pagination.defaultPerPage);
    };

    const ensurePage = (value: number | undefined): number =>
      normalizePage(value, pagination.defaultPage);

    const loadUsers = (options: LoadUsersOptions = {}) => {
      const pushUrl = options.pushUrl ?? true;
      const currentPerPage = ensurePerPage(store.perPage());
      const targetPerPage = ensurePerPage(options.perPage ?? currentPerPage);
      const targetPage = ensurePage(options.page ?? store.page());
      const term = (options.searchTerm ?? store.searchTerm()).trim();

      const token = auth.token();
      if (!token?.trim()) {
        patchState(store, {
          loading: false,
          error: null,
          searchTerm: term,
          ids: [],
          entities: {},
          pagination: null,
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
        perPage: number;
        name?: string;
        email?: string;
      } = {
        page: targetPage,
        perPage: targetPerPage,
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
            const list = items ?? [];
            const resolvedLimit = Math.max(1, pagination?.limit ?? targetPerPage);
            const resolvedTotal = pagination?.total ?? list.length;
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

            const normalizedLimit = ensurePerPage(meta.limit);
            const adjustedMeta: PaginationMeta = { ...meta, limit: normalizedLimit };
            const entities = list.reduce<Record<number, User>>((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {});
            const ids = list.map((user) => user.id);

            patchState(store, {
              ids,
              entities,
              pagination: adjustedMeta,
              loading: false,
              page: adjustedMeta.page,
              perPage: normalizedLimit,
            });

            if (pushUrl) {
              router.navigate([], {
                relativeTo: route,
                queryParams: {
                  page: adjustedMeta.page,
                  per_page: normalizedLimit,
                  search: term || null,
                },
                queryParamsHandling: 'merge',
                replaceUrl: true,
              });
            }

            if (!list.length && adjustedMeta.total > 0 && adjustedMeta.page > adjustedMeta.pages) {
              loadUsers({
                page: adjustedMeta.pages,
                perPage: normalizedLimit,
                searchTerm: term,
                pushUrl,
              });
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
      const initialPage = ensurePage(Number(qp.get('page')));
      const initialPerPage = ensurePerPage(Number(qp.get('per_page')));
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
        if (!token?.trim()) {
          return;
        }
        bootstrapped = true;
        setupInitialState();
      };

      attempt();

      effect(() => {
        const token = auth.token();
        if (token?.trim()) {
          attempt();
        } else if (bootstrapped) {
          bootstrapped = false;
          patchState(store, {
            ids: [],
            entities: {},
            pagination: null,
            loading: false,
            error: null,
            deletingId: null,
          });
        }
      });
    };

    const onSearch = (value: string) => {
      const sanitizedTerm = typeof value === 'string' ? value.trim() : '';
      if (sanitizedTerm === store.searchTerm().trim()) {
        return;
      }
      loadUsers({
        page: pagination.defaultPage,
        perPage: store.perPage(),
        searchTerm: sanitizedTerm,
        pushUrl: true,
      });
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
      const nextPage = ensurePage(page);
      loadUsers({ page: nextPage, perPage: store.perPage(), pushUrl: true });
    };

    const setPerPage = (perPage: number) => {
      const nextPerPage = ensurePerPage(perPage);
      loadUsers({ page: pagination.defaultPage, perPage: nextPerPage, pushUrl: true });
    };

    const updateStatus = (userId: number, status: 'active' | 'inactive') => {
      const entities = store.entities();
      const existing = entities[userId];
      if (!existing) {
        return;
      }

      const original = { ...existing };
      const optimistic = { ...original, status };

      patchState(store, {
        entities: {
          ...entities,
          [userId]: optimistic,
        },
      });

      // Make the API call
      usersApi
        .update(userId, { status })
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe({
          next: (updatedUser) => {
            patchState(store, {
              entities: {
                ...store.entities(),
                [userId]: updatedUser,
              },
            });
          },
          error: (err) => {
            console.error('Failed to update user status:', err);
            // Revert the optimistic update
            patchState(store, {
              entities: {
                ...store.entities(),
                [userId]: original,
              },
            });
            notifications.showError('Unable to update user status. Please try again.');
          },
        });
    };

    const setDeleting = (userId: number | null) => {
      patchState(store, { deletingId: userId });
    };

    initializeBootstrap();

    return {
      loadUsers,
      onSearch,
      toggleSort,
      setPage,
      setPerPage,
      setDeleting,
      updateStatus,
    };
  }),
) satisfies Type<UsersService>;
