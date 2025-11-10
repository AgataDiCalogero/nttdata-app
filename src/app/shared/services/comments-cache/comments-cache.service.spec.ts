import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { PostsApiService } from '@app/shared/services/posts/posts-api.service';

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
    // Arrange
    const postId = 1;
    const cached: Comment[] = [{ id: 10 } as Comment];
    service.setComments(postId, cached);

    // Act
    const result = await firstValueFrom(service.fetchComments(postId));

    // Assert
    expect(result).toEqual(cached);
    expect(postsApi.listComments).not.toHaveBeenCalled();
  });

  it('should store results fetched from API and clear in-flight entry', async () => {
    // Arrange
    const postId = 2;
    const apiComments: Comment[] = [{ id: 11 } as Comment, { id: 12 } as Comment];
    postsApi.listComments.and.returnValue(of(apiComments));

    // Act
    const result = await firstValueFrom(service.fetchComments(postId));

    // Assert
    expect(result).toEqual(apiComments);
    expect(service.getCachedComments(postId)).toEqual(apiComments);
  });

  it('should return cached count when it is still valid', async () => {
    // Arrange
    const postId = 3;
    const cached: Comment[] = [{ id: 1 } as Comment, { id: 2 } as Comment];
    service.setComments(postId, cached);

    // Act
    const result = await firstValueFrom(service.fetchCommentCount(postId));

    // Assert
    expect(result).toBe(2);
    expect(postsApi.countComments).not.toHaveBeenCalled();
  });

  it('should adjust count based on delta and never go below zero', () => {
    // Arrange
    const postId = 4;
    service.setComments(postId, [{ id: 1 } as Comment]);

    // Act
    service.adjustCount(postId, 2);
    service.adjustCount(postId, -5);

    // Assert
    expect(service.getCachedCount(postId)).toBe(0);
  });
});
