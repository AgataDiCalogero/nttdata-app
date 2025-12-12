import { isPlatformBrowser } from '@angular/common';
import { inject, computed, Type, DestroyRef, effect, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import { EMPTY, catchError, combineLatest, distinctUntilChanged, switchMap, tap } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { User } from '@/app/shared/models/user';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { mapHttpError } from '@/app/shared/utils/error-mapper';

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

interface UsersLoadCriteria {
  page: number;
  perPage: number;
  searchTerm: string;
  pushUrl: boolean;
  reload: number;
}

const normalizePage = (value: number | undefined, fallback: number) =>
  Math.max(1, Number.isFinite(value as number) ? Math.floor(value as number) : fallback);

const findNearestPerPage = (
  value: number,
  options: readonly number[],
  fallback: number,
): number => {
  const sorted = options
    .filter((option) => Number.isFinite(option) && option > 0)
    .map((option) => Math.floor(option))
    .sort((a, b) => a - b);
  if (!sorted.length) {
    return Math.max(1, Number.isFinite(value) ? Math.floor(value) : Math.floor(fallback));
  }

  const target = Math.max(1, Number.isFinite(value) ? Math.floor(value) : Math.floor(fallback));
  if (sorted.includes(target)) {
    return target;
  }

  return sorted.find((option) => option >= target) ?? sorted.at(-1) ?? Math.max(1, fallback);
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
    const i18n = inject(I18nService);
    const pagination =
      inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
      DEFAULT_PAGINATION_CONFIG;
    const isBrowser = isPlatformBrowser(platformId);
    let bootstrapped = false;
    let reloadToken = 0;
    const criteriaSignal = signal<UsersLoadCriteria | null>(null);

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

      const currentCriteria = criteriaSignal();
      const sameCriteria =
        currentCriteria !== null &&
        currentCriteria.page === targetPage &&
        currentCriteria.perPage === targetPerPage &&
        currentCriteria.searchTerm === term;

      // Avoid pointless refetches; keep a retry path when we have an error.
      if (sameCriteria && !store.error()) {
        return;
      }

      criteriaSignal.set({
        page: targetPage,
        perPage: targetPerPage,
        searchTerm: term,
        pushUrl,
        reload: sameCriteria ? ++reloadToken : reloadToken,
      });
    };

    const syncUrl = (criteria: UsersLoadCriteria, meta: PaginationMeta) => {
      if (!criteria.pushUrl) return;
      router
        .navigate([], {
          relativeTo: route,
          queryParams: {
            page: meta.page,
            per_page: meta.limit,
            search: criteria.searchTerm || null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch(() => {});
    };

    const initializeUsersStream = () => {
      if (!isBrowser) {
        patchState(store, { loading: false });
        return;
      }

      combineLatest([toObservable(criteriaSignal), toObservable(auth.token)])
        .pipe(
          distinctUntilChanged(([prevCriteria, prevToken], [nextCriteria, nextToken]) => {
            const prev = prevCriteria;
            const next = nextCriteria;
            const prevAuth = prevToken?.trim() ?? '';
            const nextAuth = nextToken?.trim() ?? '';
            if (prevAuth !== nextAuth) return false;
            if (!prev || !next) return prev === next;
            return (
              prev.page === next.page &&
              prev.perPage === next.perPage &&
              prev.searchTerm === next.searchTerm &&
              prev.pushUrl === next.pushUrl &&
              prev.reload === next.reload
            );
          }),
          switchMap(([criteria, token]) => {
            if (!criteria) {
              return EMPTY;
            }

            const normalizedToken = token?.trim() ?? '';
            if (!normalizedToken) {
              patchState(store, {
                loading: false,
                error: null,
                searchTerm: criteria.searchTerm,
                ids: [],
                entities: {},
                pagination: null,
              });
              return EMPTY;
            }

            patchState(store, {
              loading: true,
              error: null,
              searchTerm: criteria.searchTerm,
              page: criteria.page,
              perPage: criteria.perPage,
            });

            const params: {
              page: number;
              perPage: number;
              name?: string;
              email?: string;
            } = {
              page: criteria.page,
              perPage: criteria.perPage,
            };

            if (criteria.searchTerm) {
              params.name = criteria.searchTerm;
              if (criteria.searchTerm.includes('@')) {
                params.email = criteria.searchTerm;
              }
            }

            return usersApi.list(params, { cache: true }).pipe(
              tap(({ items, pagination }) => {
                const list = items ?? [];
                const resolvedLimit = Math.max(1, pagination?.limit ?? criteria.perPage);
                const resolvedTotal = pagination?.total ?? list.length;
                const resolvedPages =
                  pagination?.pages ??
                  (resolvedTotal ? Math.ceil(Math.max(resolvedTotal, 1) / resolvedLimit) : 1);

                const normalizedLimit = ensurePerPage(resolvedLimit);
                const pages = Math.max(1, resolvedPages);

                // If the user asked an out-of-range page, avoid applying an empty state.
                if (resolvedTotal > 0 && criteria.page > pages) {
                  criteriaSignal.set({
                    ...criteria,
                    page: pages,
                    perPage: normalizedLimit,
                    pushUrl: true,
                    reload: ++reloadToken,
                  });
                  return;
                }

                const resolvedPage = Math.min(
                  Math.max(1, pagination?.page ?? criteria.page),
                  pages,
                );

                const meta: PaginationMeta = {
                  total: resolvedTotal,
                  pages,
                  page: resolvedPage,
                  limit: normalizedLimit,
                };

                const entities = list.reduce<Record<number, User>>((acc, user) => {
                  acc[user.id] = user;
                  return acc;
                }, {});
                const ids = list.map((user) => user.id);

                patchState(store, {
                  ids,
                  entities,
                  pagination: meta,
                  loading: false,
                  page: meta.page,
                  perPage: meta.limit,
                });

                syncUrl(criteria, meta);
              }),
              catchError((err) => {
                console.error('Failed to load users:', err);
                patchState(store, {
                  loading: false,
                  error: i18n.translate(mapHttpError(err).messageKey),
                });
                return EMPTY;
              }),
            );
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe();
    };

    const setupInitialState = () => {
      const qp = route.snapshot.queryParamMap;
      const rawPage = qp.get('page');
      const rawPerPage = qp.get('per_page');
      const rawSearch = qp.get('search');

      const parsedPage = Number(rawPage);
      const parsedPerPage = Number(rawPerPage);

      const initialPage = ensurePage(parsedPage);
      const initialPerPage = ensurePerPage(parsedPerPage);
      const initialSearch = (rawSearch ?? '').trim();

      const needsUrlFix =
        (rawPage !== null &&
          (!Number.isFinite(parsedPage) || initialPage !== Math.floor(parsedPage))) ||
        (rawPerPage !== null &&
          (!Number.isFinite(parsedPerPage) || initialPerPage !== Math.floor(parsedPerPage))) ||
        (rawSearch !== null && rawSearch !== initialSearch);

      loadUsers({
        page: initialPage,
        perPage: initialPerPage,
        searchTerm: initialSearch,
        pushUrl: needsUrlFix,
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
          criteriaSignal.set(null);
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
            notifications.showError(i18n.translate('userDetail.unableToUpdateStatusRetry'));
          },
        });
    };

    const setDeleting = (userId: number | null) => {
      patchState(store, { deletingId: userId });
    };

    initializeUsersStream();
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
