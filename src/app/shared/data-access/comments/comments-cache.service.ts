import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, take } from 'rxjs/operators';

import { PostsApiService } from '@app/shared/data-access/posts/posts-api.service';

import type { Comment } from '@/app/shared/models/post';

@Injectable({ providedIn: 'root' })
export class CommentsCacheService {
  private static readonly DEFAULT_TTL_MS = 2 * 60 * 1000;
  private static readonly MAX_CACHED_POSTS = 50;

  readonly commentsMap = new Map<number, Comment[]>();
  readonly inFlight = new Map<number, Observable<Comment[] | null>>();
  readonly countMap = new Map<number, number>();
  readonly countInFlight = new Map<number, Observable<number>>();
  private readonly commentsExpiry = new Map<number, number>();
  private readonly countExpiry = new Map<number, number>();
  private readonly accessOrder: number[] = [];

  constructor(private readonly postsApi: PostsApiService) {}

  fetchComments(postId: number): Observable<Comment[] | null> {
    const cached = this.commentsMap.get(postId);
    if (cached && !this.isExpired(this.commentsExpiry, postId)) {
      this.updateAccessOrder(postId);
      return of(cached);
    }

    this.evictPost(postId);

    const existing = this.inFlight.get(postId) as Observable<Comment[] | null> | undefined;
    if (existing) {
      return existing;
    }

    const obs = this.postsApi.listComments(postId).pipe(
      map((comments) => comments),
      tap((comments) => {
        this.commentsMap.set(postId, comments);
        this.countMap.set(postId, comments.length);
        this.setExpiry(this.commentsExpiry, postId);
        this.setExpiry(this.countExpiry, postId);
        this.updateAccessOrder(postId);
        this.evictLRU();
      }),
      catchError(() => of<Comment[] | null>(null)),
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

  prefetchCounts(postIds: number[]): Observable<Record<number, number>> {
    if (postIds.length === 0) {
      return of({});
    }

    const tasks = postIds.map((id) =>
      this.fetchCommentCount(id).pipe(
        take(1),
        map((count) => ({ id, count })),
      ),
    );

    return forkJoin(tasks).pipe(
      map((results) =>
        results.reduce(
          (acc, curr) => ({ ...acc, [curr.id]: curr.count }),
          {} as Record<number, number>,
        ),
      ),
    );
  }

  setComments(postId: number, comments: Comment[]): void {
    this.commentsMap.set(postId, comments);
    this.countMap.set(postId, comments.length);
    this.setExpiry(this.commentsExpiry, postId);
    this.setExpiry(this.countExpiry, postId);
    this.updateAccessOrder(postId);
    this.evictLRU();
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

  hasFreshCount(postId: number): boolean {
    const cached = this.countMap.get(postId);
    if (cached === undefined) {
      return false;
    }

    const expiresAt = this.countExpiry.get(postId);
    if (expiresAt === undefined) {
      return false;
    }

    if (Date.now() > expiresAt) {
      this.countExpiry.delete(postId);
      this.countMap.delete(postId);
      return false;
    }

    return true;
  }

  clear(postId?: number): void {
    if (postId === undefined) {
      this.commentsMap.clear();
      this.inFlight.clear();
      this.countMap.clear();
      this.countInFlight.clear();
      this.commentsExpiry.clear();
      this.countExpiry.clear();
      this.accessOrder.length = 0;
      return;
    }
    this.commentsMap.delete(postId);
    this.inFlight.delete(postId);
    this.countMap.delete(postId);
    this.countInFlight.delete(postId);
    this.commentsExpiry.delete(postId);
    this.countExpiry.delete(postId);
    const index = this.accessOrder.indexOf(postId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
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
    if (expiresAt === undefined) {
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
    const index = this.accessOrder.indexOf(postId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private updateAccessOrder(postId: number): void {
    const index = this.accessOrder.indexOf(postId);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(postId);
  }

  private evictLRU(): void {
    while (this.commentsMap.size > CommentsCacheService.MAX_CACHED_POSTS) {
      const oldest = this.accessOrder.shift();
      if (oldest !== undefined) {
        this.commentsMap.delete(oldest);
        this.commentsExpiry.delete(oldest);
        this.countMap.delete(oldest);
        this.countExpiry.delete(oldest);
      }
    }
  }
}
