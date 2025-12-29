import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of } from 'rxjs';

import { PostsApiService } from '@app/shared/data-access/posts/posts-api.service';

import type { Comment } from '@/app/shared/models/post';

import { CommentsCacheService } from './comments-cache.service';

describe('CommentsCacheService', () => {
  let service: CommentsCacheService;
  let postsApi: jasmine.SpyObj<PostsApiService>;

  beforeEach(() => {
    postsApi = jasmine.createSpyObj('PostsApiService', ['listComments', 'countComments']);

    TestBed.configureTestingModule({
      providers: [CommentsCacheService, { provide: PostsApiService, useValue: postsApi }],
    });

    service = TestBed.inject(CommentsCacheService);
  });

  it('should return cached comments without calling the API', async () => {
    const postId = 1;
    const cached: Comment[] = [{ id: 10 } as Comment];
    service.setComments(postId, cached);

    const result = await firstValueFrom(service.fetchComments(postId));

    expect(result).toEqual(cached);
    expect(postsApi.listComments).not.toHaveBeenCalled();
  });

  it('should store results fetched from API and clear in-flight entry', async () => {
    const postId = 2;
    const apiComments: Comment[] = [{ id: 11 } as Comment, { id: 12 } as Comment];
    postsApi.listComments.and.returnValue(of(apiComments));
    const result = await firstValueFrom(service.fetchComments(postId));
    expect(result).toEqual(apiComments);
    expect(service.getCachedComments(postId)).toEqual(apiComments);
  });

  it('should return cached count when it is still valid', async () => {
    const postId = 3;
    const cached: Comment[] = [{ id: 1 } as Comment, { id: 2 } as Comment];
    service.setComments(postId, cached);
    const result = await firstValueFrom(service.fetchCommentCount(postId));
    expect(result).toBe(2);
    expect(postsApi.countComments).not.toHaveBeenCalled();
  });

  it('should adjust count based on delta and never go below zero', () => {
    const postId = 4;
    service.setComments(postId, [{ id: 1 } as Comment]);
    service.adjustCount(postId, 2);
    service.adjustCount(postId, -5);
    expect(service.getCachedCount(postId)).toBe(0);
  });

  it('should return empty object for prefetchCounts with no ids', async () => {
    const result = await firstValueFrom(service.prefetchCounts([]));
    expect(result).toEqual({});
    expect(postsApi.countComments).not.toHaveBeenCalled();
  });

  it('should aggregate comment counts for multiple posts', async () => {
    postsApi.countComments.and.callFake((id: number) => of(id * 2));
    const result = await firstValueFrom(service.prefetchCounts([1, 2, 3]));
    expect(result).toEqual({ 1: 2, 2: 4, 3: 6 });
    expect(service.getCachedCount(2)).toBe(4);
    expect(postsApi.countComments).toHaveBeenCalledTimes(3);
  });

  it('should dedupe concurrent count requests', async () => {
    const subject = new Subject<number>();
    postsApi.countComments.and.returnValue(subject.asObservable());
    const first = firstValueFrom(service.fetchCommentCount(99));
    const second = firstValueFrom(service.fetchCommentCount(99));
    expect(postsApi.countComments).toHaveBeenCalledTimes(1);

    subject.next(7);
    subject.complete();

    expect(await first).toBe(7);
    expect(await second).toBe(7);
    expect(service.getCachedCount(99)).toBe(7);
  });
});
