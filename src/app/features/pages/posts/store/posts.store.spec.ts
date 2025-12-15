import { DestroyRef, PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
} from '@/app/shared/config/pagination.config';
import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { Comment, Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { QueryCacheService } from '@/app/shared/services/query-cache/query-cache.service';

import { PostsFiltersService } from './posts-filters.service';
import { PostsStoreAdapter } from './posts.store';

describe('PostsStoreAdapter', () => {
  let postsApi: jasmine.SpyObj<PostsApiService>;
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let commentsCache: jasmine.SpyObj<CommentsCacheService>;
  let notifications: jasmine.SpyObj<NotificationsService>;
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
      'hasFreshCount',
      'prefetchCounts',
      'setComments',
      'adjustCount',
      'getCachedComments',
    ]);
    commentsCache.fetchComments.and.returnValue(of([{ id: 10 } as Comment]));
    commentsCache.fetchCommentCount.and.returnValue(of(4));
    commentsCache.hasFreshCount.and.returnValue(false);
    commentsCache.prefetchCounts.and.returnValue(of({ 1: 4 }));

    notifications = jasmine.createSpyObj('NotificationsService', [
      'showSuccess',
      'showHttpError',
      'showError',
      'showInfo',
    ]);
    notifications.showHttpError.and.callFake((_e, msg) => msg);

    auth = { token: () => 'token-abc' };
    spyOn(console, 'error').and.stub();

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
        QueryCacheService,
        PostsStoreAdapter,
        CommentsFacadeService,
      ],
    });

    TestBed.inject(CommentsFacadeService);
    TestBed.inject(QueryCacheService).clear();
  });

  it('carica i post iniziali e applica paginazione di default', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    tick(400);

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
    tick(400);
    expect(store.perPage()).toBe(25);

    store.setPage(3);
    tick(400);
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
    expect(commentsCache.fetchComments).toHaveBeenCalledTimes(1);
    expect(store.commentsMap()[1]?.length).toBe(1);
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

  it('imposta errore e loading false quando list fallisce', fakeAsync(() => {
    postsApi.list.and.returnValue(throwError(() => new Error('list failed')));
    notifications.showHttpError.and.returnValue('Unable to load posts');

    const store = TestBed.inject(PostsStoreAdapter);
    tick(400);

    expect(store.error()).toBe('Unable to load posts');
    expect(store.loading()).toBeFalse();
  }));

  it('deletePostRequest rimuove il post e resetta deletingId su successo', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    tick(400);
    const post = store.posts()[0];

    store.deletePostRequest(post).subscribe();
    tick();

    expect(store.posts().length).toBe(0);
    expect(store.deletingId()).toBeNull();
  }));

  it('invalida la cache su delete e non riusa dati stale', fakeAsync(() => {
    postsApi.list.and.callFake((params) => {
      const page = params?.page ?? 1;
      return of({
        items:
          page === 1
            ? ([{ id: 1, user_id: 2, title: 'P1', body: 'B1' }] as Post[])
            : ([{ id: 2, user_id: 2, title: 'P2', body: 'B2' }] as Post[]),
        pagination: { total: 20, pages: 2, page, limit: 10 },
      });
    });

    const store = TestBed.inject(PostsStoreAdapter);
    tick(400);

    expect(postsApi.list.calls.count()).toBe(1);

    store.setPage(2);
    tick(400);
    expect(postsApi.list.calls.count()).toBe(2);

    store.setPage(1);
    tick(400);
    expect(postsApi.list.calls.count()).toBe(2); // served from cache

    store.deletePostRequest({ id: 1, user_id: 2, title: 'P1', body: 'B1' } as Post).subscribe();
    tick();

    store.setPage(2);
    tick(400);
    expect(postsApi.list.calls.count()).toBe(3);

    store.setPage(1);
    tick(400);
    expect(postsApi.list.calls.count()).toBe(4);
  }));
});
