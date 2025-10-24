import { inject, signal, computed, DestroyRef, Type } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  tap,
  catchError,
  of,
  from,
  mergeMap,
} from 'rxjs';
import { signalStore, withState, withMethods, withComputed, patchState } from '@ngrx/signals';
import type {
  Comment,
  PaginationMeta,
  Post,
  User,
  PostFilters,
  QueryCriteria,
} from '@/app/shared/models';
import type { PostsService } from './posts.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';
import { CommentsCacheService } from '@/app/shared/services/comments-cache/comments-cache.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { mapHttpError } from '@/app/shared/utils/error-mapper';

interface PostsState {
  posts: Post[];
  pagination: PaginationMeta | null;
  commentsMap: Record<number, Comment[]>;
  commentsLoading: Record<number, boolean>;
  commentsCountMap: Record<number, number>;
  userOptions: User[];
  userLookup: Record<number, string>;
  deletingId: number | null;
  loading: boolean;
  error: string | null;

  filters: PostFilters;
  page: number;
  perPage: number;
  reloadToken: number;
}

export const PostsStoreAdapter = signalStore(
  withState<PostsState>({
    posts: [],
    pagination: null,
    commentsMap: {},
    commentsLoading: {},
    commentsCountMap: {},
    userOptions: [],
    userLookup: {},
    deletingId: null,
    loading: false,
    error: null,
    filters: { title: null, userId: null },
    page: 1,
    perPage: 10,
    reloadToken: 0,
  }),

  withComputed((store) => ({
    queryCriteria: computed<QueryCriteria>(() => ({
      page: store.page(),
      per_page: store.perPage(),
      title: store.filters().title ?? undefined,
      user_id: store.filters().userId ?? undefined,
      reload: store.reloadToken(),
    })),
    hasPagination: computed(() => {
      const meta = store.pagination();
      return Boolean(meta && meta.pages > 1);
    }),
    currentPage: computed(() => store.pagination()?.page ?? store.page()),
    totalPages: computed(() => store.pagination()?.pages ?? 1),
    currentPerPage: computed(() => store.pagination()?.limit ?? store.perPage()),
    postsCount: computed(() => store.posts().length),
  })),

  withMethods((store) => {
    const postsApi = inject(PostsApiService);
    const usersApi = inject(UsersApiService);
    const commentsCache = inject(CommentsCacheService);
    const toast = inject(ToastService);
    const fb = inject(FormBuilder);
    const destroyRef = inject(DestroyRef);

    const searchForm = fb.nonNullable.group({
      title: fb.nonNullable.control(''),
      userId: fb.nonNullable.control(0),
    });

    initializeSearchFormListeners(searchForm);
    initializePostsStream();
    loadUsersForFilter();

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
              pagination: state.pagination
                ? {
                    ...state.pagination,
                    total: Math.max(state.pagination.total - 1, 0),
                    pages: Math.max(
                      1,
                      Math.ceil(
                        (state.pagination.total - 1) / (state.pagination.limit || store.perPage()),
                      ),
                    ),
                  }
                : null,
            }));
            toast.show('success', 'Post deleted');
            if (shouldGoPrev) {
              patchState(store, (state) => ({ page: Math.max(state.page - 1, 1) }));
            }
            // Avoid manual reloadToken bump here: page/perPage changes and the computed queryCriteria
            // already drive list reloads. This prevents duplicate network calls.
          },
          error: (err) => {
            console.error('Failed to delete post:', err);
            patchState(store, { deletingId: null });
            const mapped = mapHttpError(err);
            toast.show('error', mapped.message);
            throw new Error(mapped.message);
          },
        }),
      );
    };

    return {
      searchForm: signal(searchForm),
      perPageOptions: signal([5, 10, 20]),

      initializePaging(page: number, perPage: number): void {
        const sanitizedPerPage = Math.max(1, perPage);
        const sanitizedPage = Math.max(1, page);
        // Changing page/perPage is sufficient to trigger data reload via queryCriteria
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
        searchForm.reset({ title: '', userId: 0 });
        patchState(store, { filters: { title: null, userId: null }, page: 1, perPage: 10 });
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
        const loaded = store.commentsMap()[postId];
        if (loaded) {
          patchState(store, (state) => {
            const copy = { ...state.commentsMap };
            delete copy[postId];
            return { commentsMap: copy };
          });
          return;
        }

        patchState(store, (state) => ({
          commentsLoading: { ...state.commentsLoading, [postId]: true },
        }));
        commentsCache
          .fetchComments(postId)
          .pipe(takeUntilDestroyed(destroyRef))
          .subscribe({
            next: (comments) => {
              patchState(store, (state) => ({
                commentsMap: { ...state.commentsMap, [postId]: comments ?? [] },
                commentsCountMap: {
                  ...state.commentsCountMap,
                  [postId]: Array.isArray(comments) ? comments.length : 0,
                },
              }));
            },
            error: (err) => {
              console.error('Failed to load comments:', err);
              toast.show('error', mapHttpError(err).message);
              patchState(store, (state) => ({
                commentsLoading: { ...state.commentsLoading, [postId]: false },
              }));
            },
            complete: () => {
              patchState(store, (state) => ({
                commentsLoading: { ...state.commentsLoading, [postId]: false },
              }));
            },
          });
      },

      onCommentCreated(postId: number, comment: Comment): void {
        patchState(store, (state) => ({
          commentsMap: {
            ...state.commentsMap,
            [postId]: [comment, ...(state.commentsMap[postId] ?? [])],
          },
          commentsCountMap: {
            ...state.commentsCountMap,
            [postId]:
              1 + (state.commentsCountMap?.[postId] ?? state.commentsMap[postId]?.length ?? 0),
          },
        }));
      },

      onCommentUpdated(postId: number, comment: Comment): void {
        patchState(store, (state) => {
          const current = state.commentsMap[postId];
          if (!current) return state;
          return {
            commentsMap: {
              ...state.commentsMap,
              [postId]: current.map((existing) =>
                existing.id === comment.id ? comment : existing,
              ),
            },
            commentsCountMap: {
              ...state.commentsCountMap,
              [postId]: current.length,
            },
          };
        });
      },

      onPostUpdated(updated: Post): void {
        patchState(store, (state) => ({
          posts: state.posts.map((post) => (post.id === updated.id ? updated : post)),
        }));
      },

      changePerPage(perPage: number): void {
        const sanitized = Math.max(1, perPage);
        if (sanitized === store.perPage()) return;
        patchState(store, { perPage: sanitized, page: 1 });
      },

      setFilters(filters: PostFilters): void {
        patchState(store, { filters, page: 1 });
      },
    };

    function initializeSearchFormListeners(form: typeof searchForm): void {
      form.controls.title.valueChanges
        .pipe(
          debounceTime(300),
          map((value) => value.trim()),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe((value) => {
          patchState(store, (state) => ({
            filters: { ...state.filters, title: value.length ? value : null },
          }));
          patchState(store, { page: 1 });
        });

      form.controls.userId.valueChanges
        .pipe(distinctUntilChanged(), takeUntilDestroyed(destroyRef))
        .subscribe((value) => {
          patchState(store, (state) => ({
            filters: { ...state.filters, userId: value > 0 ? value : null },
          }));
          patchState(store, { page: 1 });
        });
    }

    function initializePostsStream(): void {
      toObservable(store.queryCriteria)
        .pipe(
          map((criteria) => {
            const params: Record<string, unknown> = {
              page: criteria.page,
              per_page: criteria.per_page,
            };
            if (criteria.title) params.title = criteria.title;
            if (criteria.user_id) params.user_id = criteria.user_id;
            return params;
          }),
          switchMap((params) => {
            patchState(store, { loading: true, error: null });
            return postsApi.list(params).pipe(
              tap((result) => {
                patchState(store, {
                  loading: false,
                  posts: result?.items ?? [],
                  pagination: result?.pagination ?? null,
                });
                prefetchCommentCounts(result?.items ?? []);
              }),
              catchError((err) => {
                console.error('Failed to load posts:', err);
                patchState(store, { error: mapHttpError(err).message, loading: false });
                return of(null);
              }),
            );
          }),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe();
    }

    function prefetchCommentCounts(items: Post[]): void {
      const existing = store.commentsCountMap?.();
      const known = existing || {};
      const toFetch = items.filter((p) => known[p.id] === undefined);
      if (!toFetch.length) return;
      // Throttle concurrency and cache results to reduce UI churn
      from(toFetch)
        .pipe(
          mergeMap(
            (post) =>
              commentsCache.fetchComments(post.id).pipe(
                catchError(() => of<Comment[] | null>(null)),
                map((comments) => ({ post, comments })),
              ),
            3,
          ),
          takeUntilDestroyed(destroyRef),
        )
        .subscribe(({ post, comments }) => {
          const count = Array.isArray(comments) ? comments.length : 0;
          patchState(store, (state) => ({
            commentsCountMap: { ...state.commentsCountMap, [post.id]: count },
          }));
        });
    }

    function loadUsersForFilter(): void {
      usersApi
        .list({ per_page: 50 })
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
          },
        });
    }
  }),
) satisfies Type<PostsService>;
