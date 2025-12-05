import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { firstValueFrom, take } from 'rxjs';

import type {
  Comment,
  CreateComment,
  UpdateComment,
} from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { CommentsCacheService } from '../comments-cache/comments-cache.service';

@Injectable({ providedIn: 'root' })
export class CommentsFacadeService {
  private readonly postsApi = inject(PostsApiService);
  private readonly cache = inject(CommentsCacheService);
  private readonly notifications = inject(NotificationsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly commentsSignal = signal<Partial<Record<number, Comment[]>>>({});
  private readonly loadingSignal = signal<Partial<Record<number, boolean>>>({});
  private readonly countsSignal = signal<Partial<Record<number, number>>>({});

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

    const errorMessage = options?.errorMessage ?? 'Unable to load comments';

    const current = this.commentsSignal()[postId];
    if (current) {
      this.commentsSignal.update((state) => {
        const next = { ...state };
        delete next[postId];
        return next;
      });
      return;
    }

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
        error: (err) => {
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
    const ids = posts.map((p) => p.id);
    try {
      const counts = await firstValueFrom(this.cache.prefetchCounts(ids));
      if (counts) {
        this.countsSignal.update((state) => ({ ...state, ...counts }));
      }
    } catch (err) {
      console.error('Failed to prefetch comment counts', err);
    }
  }

  createComment(postId: number, payload: CreateComment): void {
    if (!this.isBrowser) return;
    this.postsApi
      .createComment(postId, payload)
      .pipe(take(1))
      .subscribe({
        next: (created) => this.applyCreated(postId, created),
        error: (err) => {
          console.error('Failed to create comment', err);
          this.notifications.showHttpError(err, 'Unable to create comment');
        },
      });
  }

  updateComment(commentId: number, payload: UpdateComment): void {
    if (!this.isBrowser) return;
    const postId = this.findPostIdByComment(commentId);
    this.postsApi
      .updateComment(commentId, payload)
      .pipe(take(1))
      .subscribe({
        next: (updated) => {
          if (postId === null) {
            return;
          }
          this.applyUpdated(postId, updated);
        },
        error: (err) => {
          console.error('Failed to update comment', err);
          this.notifications.showHttpError(err, 'Unable to update comment');
        },
      });
  }

  deleteComment(commentId: number): void {
    if (!this.isBrowser) return;
    const postId = this.findPostIdByComment(commentId);
    this.postsApi
      .deleteComment(commentId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          if (postId === null) {
            return;
          }
          this.applyDeleted(postId, commentId);
        },
        error: (err) => {
          console.error('Failed to delete comment', err);
          this.notifications.showHttpError(err, 'Unable to delete comment');
        },
      });
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
      [postId]: Math.max(
        0,
        (state[postId] ?? (this.commentsSignal()[postId]?.length ?? 0)) - 1,
      ),
    }));
    this.cache.setComments(postId, this.commentsSignal()[postId] ?? []);
  }

  private findPostIdByComment(commentId: number): number | null {
    const map = this.commentsSignal();
    for (const [key, list] of Object.entries(map)) {
      const postId = Number(key);
      if (list?.some((c) => c.id === commentId)) {
        return postId;
      }
    }
    return null;
  }
}
