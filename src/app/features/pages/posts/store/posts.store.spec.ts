import { DestroyRef, PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
} from '@/app/shared/config/pagination.config';
import type { Comment, Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
import { CommentsCacheService } from '@/app/shared/services/comments-cache/comments-cache.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { PostsApiService } from '@/app/shared/services/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/services/users/users-api.service';

import { PostsFiltersService } from './posts-filters.service';
import { PostsStoreAdapter } from './posts.store';

describe('PostsStoreAdapter', () => {
  let postsApi: jasmine.SpyObj<PostsApiService>;
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let commentsCache: jasmine.SpyObj<CommentsCacheService>;
  let notifications: jasmine.SpyObj<NotificationsService>;
  let commentsFacade: CommentsFacadeService;
  let auth: { token: () => string | null };

  beforeEach(() => {
    postsApi = jasmine.createSpyObj('PostsApiService', [
      'list',
      'delete',
      'listComments',
      'countComments',
    ]);
    postsApi.list.and.returnValue(
      of({
        items: [{ id: 1, user_id: 2, title: 'Hello', body: 'World' } as Post],
        pagination: { total: 1, pages: 1, page: 1, limit: 10 },
      }),
    );
    postsApi.delete.and.returnValue(of(void 0));
    postsApi.listComments.and.returnValue(of([{ id: 10 } as Comment]));
    postsApi.countComments.and.returnValue(of(5));

    usersApi = jasmine.createSpyObj('UsersApiService', ['list']);
    usersApi.list.and.returnValue(
      of({
        items: [
          { id: 2, name: 'User', email: 'u@example.com', status: 'active' } as unknown as User,
        ],
        pagination: { total: 1, pages: 1, page: 1, limit: 50 },
      }),
    );

    commentsCache = jasmine.createSpyObj('CommentsCacheService', [
      'fetchComments',
      'fetchCommentCount',
      'setComments',
      'adjustCount',
      'getCachedComments',
    ]);
    commentsCache.fetchComments.and.returnValue(of([{ id: 10 } as Comment]));
    commentsCache.fetchCommentCount.and.returnValue(of(4));

    notifications = jasmine.createSpyObj('NotificationsService', [
      'showSuccess',
      'showHttpError',
      'showError',
      'showInfo',
    ]);
    notifications.showHttpError.and.callFake((_e, msg) => msg);

    auth = { token: () => 'token-abc' };

    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        DestroyRef,
        FormBuilder,
        PostsFiltersService,
        { provide: PostsApiService, useValue: postsApi },
        { provide: UsersApiService, useValue: usersApi },
        { provide: CommentsCacheService, useValue: commentsCache },
        { provide: NotificationsService, useValue: notifications },
        { provide: AuthService, useValue: auth },
        { provide: PAGINATION_CONFIG, useValue: DEFAULT_PAGINATION_CONFIG },
        { provide: PLATFORM_ID, useValue: 'browser' },
        PostsStoreAdapter,
        CommentsFacadeService,
      ],
    });

    commentsFacade = TestBed.inject(CommentsFacadeService);
  });

  it('carica i post iniziali e applica paginazione di default', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    tick();

    expect(postsApi.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 10, title: undefined, userId: undefined }),
    );
    expect(store.posts().length).toBe(1);
    expect(store.pagination()?.total).toBe(1);
  }));

  it('changePerPage e setPage aggiornano i criteri e scatenano list', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    postsApi.list.calls.reset();

    store.changePerPage(25);
    tick();
    // currentPerPage legge pagination limit se presente; simuliamo la risposta con limit 25
    postsApi.list.calls.mostRecent().returnValue?.subscribe?.();
    expect(store.perPage()).toBe(25);

    store.setPage(3);
    tick();
    expect(postsApi.list.calls.count()).toBeGreaterThan(0);
  }));

  it('toggleComments recupera e memorizza i commenti quando non in cache', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    commentsCache.fetchComments.calls.reset();

    store.toggleComments(1);
    tick();

    expect(commentsCache.fetchComments).toHaveBeenCalledWith(1);
    expect(store.commentsMap()[1]?.length).toBe(1);

    store.toggleComments(1);
    tick();
    expect(store.commentsMap()[1]).toBeUndefined();
  }));

  it('deletePostRequest mostra errore HTTP e resetta deletingId su failure', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    const error = new Error('fail');
    postsApi.delete.and.returnValue(throwError(() => error));
    notifications.showHttpError.and.returnValue(
      'Unable to delete this post right now. Please try again.',
    );

    store.deletePostRequest({ id: 1, user_id: 2, title: 'T', body: 'B' } as Post).subscribe({
      error: () => void 0,
    });
    tick();

    expect(notifications.showHttpError).toHaveBeenCalled();
    expect(store.deletingId()).toBeNull();
  }));
});
