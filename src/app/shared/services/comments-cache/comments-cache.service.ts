import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import type { Comment } from '@/app/shared/models';
import { PostsApiService } from '@app/shared/services/posts/posts-api.service';

@Injectable({ providedIn: 'root' })
export class CommentsCacheService {
  private commentsMap = new Map<number, Comment[]>();
  private inFlight = new Map<number, Observable<Comment[] | null>>();

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
      tap((comments) => this.commentsMap.set(postId, comments)),
      catchError(() => of(null as Comment[] | null)),
      finalize(() => this.inFlight.delete(postId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.inFlight.set(postId, obs);
    return obs;
  }

  getCachedComments(postId: number): Comment[] | undefined {
    return this.commentsMap.get(postId);
  }

  getCachedCount(postId: number): number | undefined {
    const c = this.commentsMap.get(postId);
    return c ? c.length : undefined;
  }

  clear(postId?: number): void {
    if (postId === undefined) {
      this.commentsMap.clear();
      this.inFlight.clear();
      return;
    }
    this.commentsMap.delete(postId);
    this.inFlight.delete(postId);
  }
}
