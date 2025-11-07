import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';

import { PostsApiService } from '@app/shared/services/posts/posts-api.service';

import type { Comment } from '@/app/shared/models/post';

@Injectable({ providedIn: 'root' })
export class CommentsCacheService {
  private static readonly DEFAULT_TTL_MS = 2 * 60 * 1000; // 2 minutes cache window
  readonly commentsMap = new Map<number, Comment[]>();
  readonly inFlight = new Map<number, Observable<Comment[] | null>>();
  readonly countMap = new Map<number, number>();
  readonly countInFlight = new Map<number, Observable<number>>();
  private readonly commentsExpiry = new Map<number, number>();
  private readonly countExpiry = new Map<number, number>();

  constructor(private readonly postsApi: PostsApiService) {}

  /**
   * Fetch comments for a post, using cache and deduping in-flight requests.
   * Returns an observable that emits the comments array (or null on error).
   */
  fetchComments(postId: number): Observable<Comment[] | null> {
    const cached = this.commentsMap.get(postId);
    if (cached && !this.isExpired(this.commentsExpiry, postId)) {
      return of(cached);
    }

    this.evictPost(postId);

    const existing = this.inFlight.get(postId) as Observable<Comment[] | null> | undefined;
    if (existing) {
      return existing;
    }

    const obs = this.postsApi.listComments(postId).pipe(
      map((comments) => comments ?? []),
      tap((comments) => {
        this.commentsMap.set(postId, comments);
        this.countMap.set(postId, comments.length);
        this.setExpiry(this.commentsExpiry, postId);
        this.setExpiry(this.countExpiry, postId);
      }),
      catchError(() => of(null as Comment[] | null)),
      finalize(() => this.inFlight.delete(postId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.inFlight.set(postId, obs);
    return obs;
  }

  fetchCommentCount(postId: number): Observable<number> {
    const cached = this.countMap.get(postId);
    if (cached !== undefined && !this.isExpired(this.countExpiry, postId)) {
      return of(cached);
    }

    this.countMap.delete(postId);
    this.countExpiry.delete(postId);

    const existing = this.countInFlight.get(postId);
    if (existing) {
      return existing;
    }

    const obs = this.postsApi.countComments(postId).pipe(
      catchError(() => of(0)),
      tap((count) => this.countMap.set(postId, count)),
      tap(() => this.setExpiry(this.countExpiry, postId)),
      finalize(() => this.countInFlight.delete(postId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.countInFlight.set(postId, obs);
    return obs;
  }

  setComments(postId: number, comments: Comment[]): void {
    this.commentsMap.set(postId, comments);
    this.countMap.set(postId, comments.length);
    this.setExpiry(this.commentsExpiry, postId);
    this.setExpiry(this.countExpiry, postId);
  }

  adjustCount(postId: number, delta: number): void {
    const current = this.countMap.get(postId) ?? this.commentsMap.get(postId)?.length ?? 0;
    const next = Math.max(0, current + delta);
    this.countMap.set(postId, next);
    if (next === 0) {
      this.countExpiry.delete(postId);
    } else {
      this.setExpiry(this.countExpiry, postId);
    }
  }

  getCachedComments(postId: number): Comment[] | undefined {
    return this.commentsMap.get(postId);
  }

  getCachedCount(postId: number): number | undefined {
    if (this.countMap.has(postId)) {
      return this.countMap.get(postId);
    }
    const c = this.commentsMap.get(postId);
    return c ? c.length : undefined;
  }

  clear(postId?: number): void {
    if (postId === undefined) {
      this.commentsMap.clear();
      this.inFlight.clear();
      this.countMap.clear();
      this.countInFlight.clear();
      this.commentsExpiry.clear();
      this.countExpiry.clear();
      return;
    }
    this.commentsMap.delete(postId);
    this.inFlight.delete(postId);
    this.countMap.delete(postId);
    this.countInFlight.delete(postId);
    this.commentsExpiry.delete(postId);
    this.countExpiry.delete(postId);
  }

  private setExpiry(
    store: Map<number, number>,
    postId: number,
    ttl = CommentsCacheService.DEFAULT_TTL_MS,
  ) {
    store.set(postId, Date.now() + ttl);
  }

  private isExpired(store: Map<number, number>, postId: number): boolean {
    const expiresAt = store.get(postId);
    if (!expiresAt) {
      return false;
    }
    if (Date.now() > expiresAt) {
      store.delete(postId);
      return true;
    }
    return false;
  }

  private evictPost(postId: number): void {
    this.commentsMap.delete(postId);
    this.inFlight.delete(postId);
    this.commentsExpiry.delete(postId);
  }
}
