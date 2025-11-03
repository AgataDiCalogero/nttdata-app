import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import type { Comment } from '@/app/shared/models/post';
import { PostsApiService } from '@app/shared/services/posts/posts-api.service';

@Injectable({ providedIn: 'root' })
export class CommentsCacheService {
  readonly commentsMap = new Map<number, Comment[]>();
  readonly inFlight = new Map<number, Observable<Comment[] | null>>();
  readonly countMap = new Map<number, number>();
  readonly countInFlight = new Map<number, Observable<number>>();

  constructor(private readonly postsApi: PostsApiService) {}

  /**
   * Fetch comments for a post, using cache and deduping in-flight requests.
   * Returns an observable that emits the comments array (or null on error).
   */
  fetchComments(postId: number): Observable<Comment[] | null> {
    const cached = this.commentsMap.get(postId);
    if (cached) {
      return of(cached);
    }

    const existing = this.inFlight.get(postId) as Observable<Comment[] | null> | undefined;
    if (existing) {
      return existing;
    }

    const obs = this.postsApi.listComments(postId).pipe(
      map((comments) => comments ?? []),
      tap((comments) => {
        this.commentsMap.set(postId, comments);
        this.countMap.set(postId, comments.length);
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
    if (cached !== undefined) {
      return of(cached);
    }

    const existing = this.countInFlight.get(postId);
    if (existing) {
      return existing;
    }

    const obs = this.postsApi.countComments(postId).pipe(
      catchError(() => of(0)),
      tap((count) => this.countMap.set(postId, count)),
      finalize(() => this.countInFlight.delete(postId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.countInFlight.set(postId, obs);
    return obs;
  }

  setComments(postId: number, comments: Comment[]): void {
    this.commentsMap.set(postId, comments);
    this.countMap.set(postId, comments.length);
  }

  adjustCount(postId: number, delta: number): void {
    const current =
      this.countMap.get(postId) ?? this.commentsMap.get(postId)?.length ?? 0;
    this.countMap.set(postId, Math.max(0, current + delta));
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
      return;
    }
    this.commentsMap.delete(postId);
    this.inFlight.delete(postId);
    this.countMap.delete(postId);
    this.countInFlight.delete(postId);
  }
}
