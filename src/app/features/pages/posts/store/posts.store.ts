import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, DestroyRef, Type, computed, effect, inject, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { catchError, map, of, switchMap, tap, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
  type PaginationConfig,
} from '@/app/shared/config/pagination.config';
import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { Comment, Post, PostFilters, QueryCriteria } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';

import { PostsFiltersService } from './posts-filters.service';
import type { PostsService } from './posts.service';

interface PostsState {
  posts: Post[];
  postEntities: Record<number, Post>;
  pagination: PaginationMeta | null;
  userOptions: User[];
  userLookup: Record<number, string>;
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
  userOptions: [],
  userLookup: {},
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
    };
  }),

  withMethods((store) => {
    const postsApi = inject(PostsApiService);
    const usersApi = inject(UsersApiService);
    const commentsFacade = inject(CommentsFacadeService);
    const notifications = inject(NotificationsService);
    const destroyRef = inject(DestroyRef);
    const platformId = inject(PLATFORM_ID);
    const auth = inject(AuthService);
    const filtersService = inject(PostsFiltersService);
    const pagination =
      inject<PaginationConfig | null>(PAGINATION_CONFIG, { optional: true }) ??
      DEFAULT_PAGINATION_CONFIG;
    const isBrowser = isPlatformBrowser(platformId);

    patchState(store, {
      page: pagination.defaultPage,
      perPage: pagination.defaultPerPage,
    });

    const searchForm = signal(filtersService.form);
    const perPageOptions = signal([...pagination.perPageOptions]);

    initializePostsStream();
    setupUserOptionsBootstrap();
    syncPaginationOnFilterChange();

    const performDeletePost = (post: Post) => {
      const shouldGoPrev =
        store.posts().length <= 1 && store.currentPage() > 1 && store.totalPages() > 1;

      patchState(store, { deletingId: post.id });

      return postsApi.delete(post.id).pipe(
        tap({
          next: () => {
            patchState(store, (state) => ({
              deletingId: null,
              posts: state.posts.filter((item) => item.id !== post.id),
              postEntities: (() => {
                const next = { ...state.postEntities };
                delete next[post.id];
                return next;
              })(),
              pagination: state.pagination
                ? {
                    ...state.pagination,
                    total: Math.max(state.pagination.total - 1, 0),
                    pages: Math.max(
                      1,
                      Math.ceil(
                        Math.max(state.pagination.total - 1, 0) /
                          (state.pagination.limit || store.perPage()),
                      ),
                    ),
                  }
                : null,
            }));
            notifications.showSuccess('Post deleted');
            if (shouldGoPrev) {
              patchState(store, (state) => ({ page: Math.max(state.page - 1, 1) }));
            }
          },
          error: (err) => {
            console.error('Failed to delete post:', err);
            patchState(store, { deletingId: null });
          },
        }),
        catchError((err) => {
          const message = notifications.showHttpError(
            err,
            'Unable to delete this post right now. Please try again.',
          );
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
      },

      setPage(page: number): void {
        const totalPages = Math.max(store.totalPages(), 1);
        const next = Math.max(1, Math.min(page, totalPages));
        patchState(store, { page: next });
      },

      refresh(): void {
        patchState(store, (state) => ({ reloadToken: state.reloadToken + 1 }));
      },

      resetFilters(): void {
        filtersService.reset();
        patchState(store, {
          page: pagination.defaultPage,
          perPage: pagination.defaultPerPage,
        });
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

      toggleComments(postId: number): void {
        commentsFacade.toggleComments(postId);
      },

      onCommentCreated(postId: number, comment: Comment): void {
        commentsFacade.applyCreated(postId, comment);
      },

      onCommentUpdated(postId: number, comment: Comment): void {
        commentsFacade.applyUpdated(postId, comment);
      },

      onCommentDeleted(postId: number, commentId: number): void {
        commentsFacade.applyDeleted(postId, commentId);
      },

      onPostUpdated(updated: Post): void {
        patchState(store, (state) => ({
          posts: state.posts.map((post) => (post.id === updated.id ? updated : post)),
          postEntities: {
            ...state.postEntities,
            [updated.id]: updated,
          },
        }));
      },

      changePerPage(perPage: number): void {
        const sanitized = Math.max(1, perPage);
        if (sanitized === store.perPage()) return;
        patchState(store, { perPage: sanitized, page: pagination.defaultPage });
      },

      setFilters(filters: PostFilters): void {
        filtersService.patch(filters);
      },
    };

    function initializePostsStream(): void {
      if (!isBrowser) {
        patchState(store, { loading: false });
        return;
      }

      toObservable(store.queryCriteria)
        .pipe(
          map((criteria) => ({
            page: criteria.page,
            perPage: criteria.perPage,
            title: criteria.title,
            userId: criteria.userId,
          })),
          switchMap((params) => {
            patchState(store, { loading: true, error: null });
            return postsApi.list(params).pipe(
              tap((result) => {
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
                prefetchCommentCounts(list);
              }),
              catchError((err) => {
                console.error('Failed to load posts:', err);
                const message = notifications.showHttpError(err, 'Unable to load posts');
                patchState(store, { error: message, loading: false });
                return of(null);
              }),
            );
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe();
    }

    function prefetchCommentCounts(items: Post[]): void {
      if (!isBrowser) {
        return;
      }
      void commentsFacade.prefetchCounts(items);
    }

    function loadUsersForFilter(): void {
      usersApi
        .list({ perPage: 50 }, { cache: true })
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe({
          next: ({ items }) => {
            const list = items ?? [];
            const lookup = list.reduce<Record<number, string>>((acc, user) => {
              acc[user.id] = user.name ?? `User #${user.id}`;
              return acc;
            }, {});
            patchState(store, { userOptions: list, userLookup: lookup });
          },
          error: (err) => {
            console.error('Failed to load users for filters:', err);
            notifications.showHttpError(err, 'Unable to load users list');
          },
        });
    }

    function setupUserOptionsBootstrap(): void {
      if (!isBrowser) {
        return;
      }

      let userOptionsRequested = false;

      const tryLoad = () => {
        if (userOptionsRequested) {
          return;
        }
        const token = auth.token();
        if (!token || !token.trim()) {
          return;
        }
        userOptionsRequested = true;
        loadUsersForFilter();
      };

      tryLoad();

      effect(() => {
        const token = auth.token();
        if (token && token.trim()) {
          tryLoad();
        } else {
          userOptionsRequested = false;
          patchState(store, { userOptions: [], userLookup: {} });
        }
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
        }
        previous = filters;
      });
    }
  }),
) satisfies Type<PostsService>;
