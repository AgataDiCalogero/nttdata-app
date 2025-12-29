import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, DestroyRef, Type, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  Subject,
  startWith,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { Post, PostFilters, QueryCriteria } from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { QueryCacheService } from '@/app/shared/services/query-cache/query-cache.service';
import { UsersLookupService } from '@/app/shared/services/users/users-lookup.service';
import { normalizePage } from '@/app/shared/utils/pagination-utils';

import { POSTS_STORE_CONFIG } from './posts-store.config';
import { PostsFiltersService } from '../services/posts-filters.service';
import type { PostsService } from '../services/posts.service';

interface PostsState {
  posts: Post[];
  postEntities: Record<number, Post>;
  pagination: PaginationMeta | null;
  deletingId: number | null;
  loading: boolean;
  error: string | null;
  page: number;
  perPage: number;
  reloadToken: number;
}

const defaultState: PostsState = {
  posts: [],
  postEntities: {},
  pagination: null,
  deletingId: null,
  loading: false,
  error: null,
  page: 1,
  perPage: 10,
  reloadToken: 0,
};

export const PostsStoreAdapter = signalStore(
  withState<PostsState>(defaultState),

  withComputed((store) => {
    const filtersService = inject(PostsFiltersService);
    const commentsFacade = inject(CommentsFacadeService);
    const usersLookup = inject(UsersLookupService);

    return {
      filters: computed(() => filtersService.filters()),
      queryCriteria: computed<QueryCriteria>(() => {
        const filters = filtersService.filters();
        return {
          page: store.page(),
          perPage: store.perPage(),
          title: filters.title ?? undefined,
          userId: filters.userId ?? undefined,
          reload: store.reloadToken(),
        };
      }),
      hasPagination: computed(() => {
        const meta = store.pagination();
        return Boolean(meta && meta.pages > 1);
      }),
      currentPage: computed(() => store.pagination()?.page ?? store.page()),
      totalPages: computed(() => store.pagination()?.pages ?? 1),
      currentPerPage: computed(() => store.pagination()?.limit ?? store.perPage()),
      totalPosts: computed(() => store.pagination()?.total ?? store.posts().length),
      commentsMap: computed(() => commentsFacade.comments()),
      commentsLoading: computed(() => commentsFacade.loading()),
      commentsCountMap: computed(() => commentsFacade.counts()),
      userOptions: computed(() => usersLookup.users()),
      userLookup: computed(() =>
        usersLookup.users().reduce<Record<number, string>>((acc, user) => {
          acc[user.id] = user.name;
          return acc;
        }, {}),
      ),
    };
  }),

  withMethods((store) => {
    const postsApi = inject(PostsApiService);
    const commentsFacade = inject(CommentsFacadeService);
    const usersLookup = inject(UsersLookupService);
    const notifications = inject(NotificationsService);
    const i18n = inject(I18nService);
    const destroyRef = inject(DestroyRef);
    const platformId = inject(PLATFORM_ID);
    const filtersService = inject(PostsFiltersService);
    const queryCache = inject(QueryCacheService);
    const postsStoreConfig = inject(POSTS_STORE_CONFIG);
    const pagination =
      inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
      DEFAULT_PAGINATION_CONFIG;
    const isBrowser = isPlatformBrowser(platformId);
    const POSTS_CACHE_TTL_MS = 30_000;

    const invalidatePostsCache = (): void => {
      queryCache.invalidate('posts|');
    };

    const computePaginationAfterRemoval = (state: PostsState): PaginationMeta | null => {
      if (!state.pagination) return null;
      const nextTotal = Math.max(state.pagination.total - 1, 0);
      const limit = state.pagination.limit || store.perPage();
      return {
        ...state.pagination,
        total: nextTotal,
        pages: Math.max(1, Math.ceil(nextTotal / limit)),
      };
    };

    const removePostFromState = (state: PostsState, id: number) => {
      const nextEntities = { ...state.postEntities };
      delete nextEntities[id];

      return {
        deletingId: null,
        posts: state.posts.filter((item) => item.id !== id),
        postEntities: nextEntities,
        pagination: computePaginationAfterRemoval(state),
      };
    };

    const applyPostsResult = (
      result: { items?: Post[]; pagination?: PaginationMeta | null } | null,
    ) => {
      const list = result?.items ?? [];
      const entities = list.reduce<Record<number, Post>>((acc, post) => {
        acc[post.id] = post;
        return acc;
      }, {});
      patchState(store, {
        loading: false,
        posts: list,
        postEntities: entities,
        pagination: result?.pagination ?? null,
      });
    };

    const handleListError = (err: unknown) => {
      console.error('Failed to load posts:', err);
      const message = notifications.showHttpError(err, i18n.translate('posts.loadError'));
      patchState(store, { error: message, loading: false });
      return of(null);
    };

    const fetchPosts = (params: QueryCriteria) => {
      const { page, perPage, title, userId, reload } = params;
      const cacheKey = `posts|${page}|${perPage}|${title ?? ''}|${userId ?? ''}|${reload}`;

      const cached = queryCache.get<{ items: Post[]; pagination: PaginationMeta | null }>(cacheKey);

      if (cached) {
        applyPostsResult(cached);
        return of(cached);
      }

      return postsApi.list({ page, perPage, title, userId }).pipe(
        map((result) => ({
          items: result.items,
          pagination: result.pagination ?? null,
        })),
        tap((toCache) => {
          queryCache.set(cacheKey, toCache, { ttl: POSTS_CACHE_TTL_MS });
          applyPostsResult(toCache);
          prefetchCommentCounts(toCache.items);
        }),
        catchError((err) => handleListError(err)),
      );
    };

    const shouldGoToPreviousPage = () =>
      store.posts().length <= 1 && store.currentPage() > 1 && store.totalPages() > 1;

    const immediateListRequests$ = new Subject<QueryCriteria>();
    const debouncedListRequests$ = new Subject<QueryCriteria>();

    patchState(store, {
      page: pagination.defaultPage,
      perPage: pagination.defaultPerPage,
    });

    const searchForm = signal(filtersService.form);
    const perPageOptions = signal([...pagination.perPageOptions]);

    initializePostsStream();
    bootstrapUserOptions();
    syncPaginationOnFilterChange();

    const performDeletePost = (post: Post | null | undefined) => {
      const postId = post?.id;
      if (typeof postId !== 'number' || !Number.isFinite(postId)) {
        patchState(store, { deletingId: null });
        return throwError(() => new Error('Invalid post'));
      }

      const shouldGoPrev = shouldGoToPreviousPage();

      patchState(store, { deletingId: postId });

      return postsApi.delete(postId).pipe(
        tap({
          next: () => {
            patchState(store, (state) => removePostFromState(state, postId));
            invalidatePostsCache();
            patchState(store, (state) => ({ reloadToken: state.reloadToken + 1 }));
            notifications.showSuccess(i18n.translate('posts.delete.success'));
            if (shouldGoPrev) {
              patchState(store, (state) => ({ page: Math.max(state.page - 1, 1) }));
              requestImmediateListReload();
            }
          },
          error: (err) => {
            console.error('Failed to delete post:', err);
            patchState(store, { deletingId: null });
          },
        }),
        catchError((err) => {
          const message = notifications.showHttpError(err, i18n.translate('posts.delete.error'));
          return throwError(() => new Error(message));
        }),
      );
    };

    return {
      searchForm,
      perPageOptions,

      initializePaging(page: number, perPage: number): void {
        const sanitizedPerPage = Math.max(1, perPage);
        const sanitizedPage = Math.max(1, page);
        patchState(store, { perPage: sanitizedPerPage, page: sanitizedPage });
        requestImmediateListReload();
      },

      setPage(page: number): void {
        const configuredTotalPages = store.pagination()?.pages;
        const next =
          typeof configuredTotalPages === 'number' && Number.isFinite(configuredTotalPages)
            ? Math.max(1, Math.min(page, Math.max(1, configuredTotalPages)))
            : Math.max(1, page);
        patchState(store, { page: next });
        requestImmediateListReload();
      },

      refresh(): void {
        invalidatePostsCache();
        patchState(store, (state) => ({ reloadToken: state.reloadToken + 1 }));
        requestImmediateListReload();
      },

      resetFilters(): void {
        filtersService.reset();
        patchState(store, {
          page: pagination.defaultPage,
          perPage: pagination.defaultPerPage,
        });
        requestDebouncedListReload();
      },

      deletePost(post: Post): void {
        performDeletePost(post)
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe({
            next: () => void 0,
            error: () => void 0,
          });
      },

      deletePostRequest(post: Post) {
        return performDeletePost(post);
      },

      onPostUpdated(updated: Post): void {
        patchState(store, (state) => ({
          posts: state.posts.map((post) => (post.id === updated.id ? updated : post)),
          postEntities: {
            ...state.postEntities,
            [updated.id]: updated,
          },
        }));
        invalidatePostsCache();
      },

      changePerPage(perPage: number): void {
        const sanitized = Math.max(1, perPage);
        if (sanitized === store.perPage()) return;
        const nextPage = normalizePage(1, pagination.defaultPage);
        patchState(store, { perPage: sanitized, page: nextPage });
        requestImmediateListReload();
      },

      setFilters(filters: PostFilters): void {
        filtersService.patch(filters);
        requestDebouncedListReload();
      },
    };

    function initializePostsStream(): void {
      if (!isBrowser) {
        patchState(store, { loading: false });
        return;
      }

      const debounceMs = Math.max(0, postsStoreConfig.debounceMs);

      immediateListRequests$
        .pipe(
          startWith(store.queryCriteria()),
          distinctUntilChanged(
            (a, b) =>
              a.page === b.page &&
              a.perPage === b.perPage &&
              a.title === b.title &&
              a.userId === b.userId &&
              a.reload === b.reload,
          ),
          switchMap((criteria) => {
            patchState(store, { loading: true, error: null });
            return fetchPosts(criteria);
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe({ next: () => void 0, error: () => void 0 });

      debouncedListRequests$
        .pipe(
          debounceTime(debounceMs),
          distinctUntilChanged(
            (a, b) =>
              a.page === b.page &&
              a.perPage === b.perPage &&
              a.title === b.title &&
              a.userId === b.userId &&
              a.reload === b.reload,
          ),
          switchMap((criteria) => {
            patchState(store, { loading: true, error: null });
            return fetchPosts(criteria);
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe({ next: () => void 0, error: () => void 0 });
    }

    function requestImmediateListReload(): void {
      if (!isBrowser) return;
      immediateListRequests$.next(store.queryCriteria());
    }

    function requestDebouncedListReload(): void {
      if (!isBrowser) return;
      debouncedListRequests$.next(store.queryCriteria());
    }

    function prefetchCommentCounts(items: Post[]): void {
      if (!isBrowser) {
        return;
      }
      void commentsFacade.prefetchCounts(items);
    }

    function bootstrapUserOptions(): void {
      if (!isBrowser) {
        return;
      }
      usersLookup
        .ensureUsersLoaded()
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe({
          error: (err) => {
            console.error('Failed to load users for filters:', err);
            notifications.showHttpError(err, i18n.translate('users.loadListError'));
          },
        });
    }

    function syncPaginationOnFilterChange(): void {
      let previous: PostFilters | null = null;
      effect(() => {
        const filters = filtersService.filters();
        if (previous && previous.title === filters.title && previous.userId === filters.userId) {
          return;
        }
        if (previous) {
          patchState(store, { page: pagination.defaultPage });
          requestDebouncedListReload();
        }
        previous = filters;
      });
    }
  }),
) satisfies Type<PostsService>;
