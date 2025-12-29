import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom, of, take } from 'rxjs';

import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Comment, CreateComment, UpdateComment } from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

@Injectable({ providedIn: 'root' })
export class CommentsFacadeService {
  private static readonly PREFETCH_DEBOUNCE_MS = 150;

  private readonly postsApi = inject(PostsApiService);
  private readonly cache = inject(CommentsCacheService);
  private readonly notifications = inject(NotificationsService);
  private readonly i18n = inject(I18nService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly commentsSignal = signal<Partial<Record<number, Comment[]>>>({});
  private readonly loadingSignal = signal<Partial<Record<number, boolean>>>({});
  private readonly countsSignal = signal<Partial<Record<number, number>>>({});
  private lastPrefetchKey: string | null = null;
  private lastPrefetchAt = 0;

  comments(): Partial<Record<number, Comment[]>> {
    return this.commentsSignal();
  }

  loading(): Partial<Record<number, boolean>> {
    return this.loadingSignal();
  }

  counts(): Partial<Record<number, number>> {
    return this.countsSignal();
  }

  commentsFor(postId: number): Comment[] {
    return this.commentsSignal()[postId] ?? [];
  }

  isLoaded(postId: number): boolean {
    return Object.hasOwn(this.commentsSignal(), postId);
  }

  isLoading(postId: number): boolean {
    return Boolean(this.loadingSignal()[postId]);
  }

  toggleComments(postId: number, options?: { errorMessage?: string }): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.isLoading(postId) || this.isLoaded(postId)) {
      return;
    }

    const errorMessage =
      options?.errorMessage ?? this.i18n.translate('userDetail.unableToLoadComments');

    this.loadingSignal.update((state) => ({ ...state, [postId]: true }));
    this.cache
      .fetchComments(postId)
      .pipe(take(1))
      .subscribe({
        next: (comments) => {
          const list = comments ?? [];
          this.commentsSignal.update((state) => ({ ...state, [postId]: list }));
          this.countsSignal.update((state) => ({
            ...state,
            [postId]: list.length,
          }));
          this.cache.setComments(postId, list);
        },
        error: (err: unknown) => {
          console.error('Failed to load comments', err);
          this.notifications.showHttpError(err, errorMessage);
          this.loadingSignal.update((state) => ({ ...state, [postId]: false }));
        },
        complete: () => {
          this.loadingSignal.update((state) => ({ ...state, [postId]: false }));
        },
      });
  }

  async prefetchCounts(posts: { id: number }[]): Promise<void> {
    if (!this.isBrowser || !posts.length) {
      return;
    }

    const ids = Array.from(
      new Set(posts.map((p) => p.id).filter((id) => Number.isFinite(id) && id > 0)),
    ).sort((a, b) => a - b);

    const idsToFetch = ids.filter((id) => !this.cache.hasFreshCount(id));
    if (!idsToFetch.length) {
      return;
    }

    const now = Date.now();
    const key = idsToFetch.join(',');
    if (
      key &&
      this.lastPrefetchKey === key &&
      now - this.lastPrefetchAt < CommentsFacadeService.PREFETCH_DEBOUNCE_MS
    ) {
      return;
    }

    this.lastPrefetchKey = key;
    this.lastPrefetchAt = now;
    try {
      const counts = await firstValueFrom(this.cache.prefetchCounts(idsToFetch));
      this.countsSignal.update((state) => ({ ...state, ...counts }));
    } catch (err: unknown) {
      console.error('Failed to prefetch comment counts', err);
    }
  }

  createComment(postId: number, payload: CreateComment) {
    if (!this.isBrowser) return of(null as unknown as Comment);
    return this.postsApi.createComment(postId, payload).pipe(take(1));
  }

  updateComment(commentId: number, payload: UpdateComment) {
    if (!this.isBrowser) return of(null as unknown as Comment);
    return this.postsApi.updateComment(commentId, payload).pipe(take(1));
  }

  deleteComment(commentId: number) {
    if (!this.isBrowser) return of(void 0);
    return this.postsApi.deleteComment(commentId).pipe(take(1));
  }

  applyCreated(postId: number, comment: Comment): void {
    this.commentsSignal.update((state) => {
      const current = state[postId] ?? [];
      return { ...state, [postId]: [comment, ...current] };
    });
    this.countsSignal.update((state) => ({
      ...state,
      [postId]: (state[postId] ?? 0) + 1,
    }));
    this.cache.setComments(postId, this.commentsSignal()[postId] ?? []);
  }

  applyUpdated(postId: number, comment: Comment): void {
    this.commentsSignal.update((state) => {
      const current = state[postId];
      if (!current) return state;
      const next = current.map((c) => (c.id === comment.id ? comment : c));
      return { ...state, [postId]: next };
    });
    this.cache.setComments(postId, this.commentsSignal()[postId] ?? []);
  }

  applyDeleted(postId: number, commentId: number): void {
    this.commentsSignal.update((state) => {
      const current = state[postId];
      if (!current) return state;
      const filtered = current.filter((c) => c.id !== commentId);
      return { ...state, [postId]: filtered };
    });
    this.countsSignal.update((state) => ({
      ...state,
      [postId]: Math.max(0, (state[postId] ?? this.commentsSignal()[postId]?.length ?? 0) - 1),
    }));
    this.cache.setComments(postId, this.commentsSignal()[postId] ?? []);
  }
}
