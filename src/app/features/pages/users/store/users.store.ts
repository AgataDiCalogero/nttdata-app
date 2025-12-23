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
import { normalizePage, findNearestOption } from '@/app/shared/utils/pagination-utils';

import type { SortField, UsersService } from './users.service';

interface SortState {
  field: SortField;
  dir: 1 | -1;
}

interface UsersState {
  ids: number[];
  entities: Record<number, User | undefined>;
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
  forceReload?: boolean;
}

interface UsersLoadCriteria {
  page: number;
  perPage: number;
  searchTerm: string;
  pushUrl: boolean;
  reload: number;
}

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
        const rawValue = u[field];
        const normalized = typeof rawValue === 'string' ? rawValue : String(rawValue);
        return normalized.toLowerCase();
      };

      return store
        .ids()
        .map((id) => entities[id])
        .filter((user): user is User => user !== undefined)
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
      return findNearestOption(normalized, options, pagination.defaultPerPage);
    };

    const ensurePage = (value: number | undefined): number =>
      normalizePage(value, pagination.defaultPage);

    const resetFilters = () => {
      patchState(store, {
        page: pagination.defaultPage,
        perPage: pagination.defaultPerPage,
        searchTerm: '',
      });
      loadUsers({
        page: pagination.defaultPage,
        perPage: pagination.defaultPerPage,
        searchTerm: '',
        pushUrl: true,
      });
    };

    const loadUsers = (options: LoadUsersOptions = {}) => {
      const pushUrl = options.pushUrl ?? true;
      const currentPerPage = ensurePerPage(store.perPage());
      const targetPerPage = ensurePerPage(options.perPage ?? currentPerPage);
      const targetPage = ensurePage(options.page ?? store.page());
      const term = (options.searchTerm ?? store.searchTerm()).trim();
      const forceReload = options.forceReload ?? false;

      const currentCriteria = criteriaSignal();
      const currentError = store.error();
      const sameCriteria =
        currentCriteria !== null &&
        currentCriteria.page === targetPage &&
        currentCriteria.perPage === targetPerPage &&
        currentCriteria.searchTerm === term;

      if (!forceReload && sameCriteria && currentError === null) {
        return;
      }

      const shouldForceReload = sameCriteria || forceReload;
      const reloadValue = shouldForceReload ? ++reloadToken : reloadToken;

      criteriaSignal.set({
        page: targetPage,
        perPage: targetPerPage,
        searchTerm: term,
        pushUrl,
        reload: reloadValue,
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

    const handleFetchSuccess = (
      items: User[],
      paginationMeta: PaginationMeta | null,
      criteria: UsersLoadCriteria,
    ) => {
      const userList = items;
      const entities = userList.reduce<Record<number, User>>((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {});
      const ids = userList.map((user) => user.id);

      patchState(store, {
        ids,
        entities,
        pagination: paginationMeta,
        loading: false,
        page: paginationMeta?.page ?? criteria.page,
        perPage: paginationMeta?.limit ?? criteria.perPage,
      });

      if (paginationMeta) {
        syncUrl(criteria, paginationMeta);
      }
    };

    const initializeUsersStream = () => {
      if (!isBrowser) {
        patchState(store, { loading: false });
        return;
      }

      combineLatest([toObservable(criteriaSignal), toObservable(auth.token)])
        .pipe(
          distinctUntilChanged(
            (
              [prevCriteria, prevToken]: [UsersLoadCriteria | null, string | null | undefined],
              [nextCriteria, nextToken]: [UsersLoadCriteria | null, string | null | undefined],
            ) => {
              const prevAuth = prevToken?.trim() ?? '';
              const nextAuth = nextToken?.trim() ?? '';
              if (prevAuth !== nextAuth) return false;

              if (!prevCriteria || !nextCriteria) return prevCriteria === nextCriteria;

              return (
                prevCriteria.page === nextCriteria.page &&
                prevCriteria.perPage === nextCriteria.perPage &&
                prevCriteria.searchTerm === nextCriteria.searchTerm &&
                prevCriteria.pushUrl === nextCriteria.pushUrl &&
                prevCriteria.reload === nextCriteria.reload
              );
            },
          ),
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
              ids: [],
              entities: {},
              pagination: null,
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

            const term = criteria.searchTerm || '';
            if (term) {
              params.name = term;
              if (term.includes('@')) {
                params.email = term;
              }
            }

            return usersApi.list(params, { cache: true }).pipe(
              tap(({ items, pagination }) => {
                const list = items;
                const resolvedLimit = Math.max(1, pagination?.limit ?? criteria.perPage);
                const resolvedTotal = pagination?.total ?? list.length;
                const resolvedPages =
                  pagination?.pages ??
                  (resolvedTotal ? Math.ceil(Math.max(resolvedTotal, 1) / resolvedLimit) : 1);

                const normalizedLimit = ensurePerPage(resolvedLimit);
                const pages = Math.max(1, resolvedPages);

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

                handleFetchSuccess(list, meta, criteria);
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
        const normalizedToken = token?.trim() ?? '';
        if (!normalizedToken) {
          return;
        }
        bootstrapped = true;
        setupInitialState();
      };

      attempt();

      effect(() => {
        const token = auth.token();
        const normalizedToken = token?.trim() ?? '';
        if (normalizedToken) {
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

    const updateStatus = (userId: number, status: 'active' | 'inactive') => {
      const entities = store.entities();
      const existing = entities[userId];
      if (existing === undefined) {
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

    initializeUsersStream();
    initializeBootstrap();

    return {
      loadUsers,
      updateStatus,
      setDeleting(userId: number | null) {
        patchState(store, { deletingId: userId });
      },
      resetFilters,
      onSearch: (value: string) => {
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
      },
      toggleSort: (field: SortField) => {
        const current = store.sortState();
        if (current.field === field) {
          patchState(store, {
            sortState: { field, dir: current.dir === 1 ? -1 : 1 },
          });
        } else {
          patchState(store, { sortState: { field, dir: 1 } });
        }
      },
      setPage: (page: number) => {
        const nextPage = ensurePage(page);
        loadUsers({ page: nextPage, perPage: store.perPage(), pushUrl: true });
      },
      setPerPage: (perPage: number) => {
        const nextPerPage = ensurePerPage(perPage);
        loadUsers({ page: pagination.defaultPage, perPage: nextPerPage, pushUrl: true });
      },
    };
  }),
) satisfies Type<UsersService>;
