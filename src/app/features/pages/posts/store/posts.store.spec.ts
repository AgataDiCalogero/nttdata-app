import { DestroyRef, PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthService } from '@/app/core/auth/auth-service/auth.service';
import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import {
  DEFAULT_PAGINATION_CONFIG,
  PAGINATION_CONFIG,
} from '@/app/shared/config/pagination.config';
import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import type { Comment, Post } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';
import { QueryCacheService } from '@/app/shared/services/query-cache/query-cache.service';

import { POSTS_STORE_CONFIG } from './posts-store.config';
import { PostsStoreAdapter } from './posts.store';
import { PostsFiltersService } from '../services/posts-filters.service';

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
        { provide: POSTS_STORE_CONFIG, useValue: { debounceMs: 0 } },
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
    tick();

    expect(postsApi.list).toHaveBeenCalledWith(
      jasmine.objectContaining({ page: 1, perPage: 10, title: undefined, userId: undefined }),
    );
    expect(store.posts().length).toBe(1);
    expect(store.pagination()?.total).toBe(1);
  }));

  it('changePerPage e setPage aggiornano i criteri e ricaricano la lista', fakeAsync(() => {
    postsApi.list.and.returnValue(
      of({
        items: [{ id: 1, user_id: 2, title: 'Hello', body: 'World' } as Post],
        pagination: { total: 50, pages: 5, page: 1, limit: 10 },
      }),
    );

    const store = TestBed.inject(PostsStoreAdapter);
    tick(0);
    flushMicrotasks();
    postsApi.list.calls.reset();

    store.changePerPage(25);
    tick(0);
    flushMicrotasks();

    expect(store.perPage()).toBe(25);
    expect(store.page()).toBe(1);
    expect(postsApi.list).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1, perPage: 25 }));

    postsApi.list.calls.reset();
    store.setPage(3);
    tick(0);
    flushMicrotasks();

    expect(store.page()).toBe(3);
    expect(postsApi.list).toHaveBeenCalledWith(jasmine.objectContaining({ page: 3, perPage: 25 }));
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
    tick();

    expect(store.error()).toBe('Unable to load posts');
    expect(store.loading()).toBeFalse();
  }));

  it('deletePostRequest rimuove il post e resetta deletingId su successo', fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    tick();
    const post = store.posts()[0];

    store.deletePostRequest(post).subscribe();
    tick();

    expect(store.posts().length).toBe(0);
    expect(store.deletingId()).toBeNull();
  }));

  it("deletePostRequest rifiuta post invalidi senza chiamare l'API", fakeAsync(() => {
    const store = TestBed.inject(PostsStoreAdapter);
    tick();
    flushMicrotasks();

    postsApi.delete.calls.reset();
    store.deletePostRequest(null as unknown as Post).subscribe({
      error: () => void 0,
    });
    tick();

    expect(postsApi.delete).not.toHaveBeenCalled();
    expect(store.deletingId()).toBeNull();
  }));

  it("deletePostRequest torna alla pagina precedente quando l'ultimo post di una pagina superiore viene rimosso", fakeAsync(() => {
    const queryCache = TestBed.inject(QueryCacheService);
    spyOn(queryCache, 'invalidate').and.callThrough();

    const page1Response = {
      items: [{ id: 101, user_id: 2, title: 'P1', body: 'B1' }] as Post[],
      pagination: { total: 20, pages: 2, page: 1, limit: 10 },
    };
    const page2Response = {
      items: [{ id: 202, user_id: 2, title: 'P2', body: 'B2' }] as Post[],
      pagination: { total: 20, pages: 2, page: 2, limit: 10 },
    };

    postsApi.list.and.callFake((params) => {
      const page = params?.page ?? 1;
      return of(page === 2 ? page2Response : page1Response);
    });

    const store = TestBed.inject(PostsStoreAdapter);
    tick();
    flushMicrotasks();
    expect(store.page()).toBe(1);

    postsApi.list.calls.reset();

    store.setPage(2);
    tick();
    flushMicrotasks();
    expect(store.page()).toBe(2);
    expect(store.posts().map((p) => p.id)).toEqual([202]);

    const postOnPage2 = store.posts()[0];
    store.deletePostRequest(postOnPage2).subscribe();
    tick();
    flushMicrotasks();

    expect(queryCache.invalidate).toHaveBeenCalledWith('posts|');
    expect(store.page()).toBe(1);
    expect(store.posts().map((p) => p.id)).toEqual([101]);
    const calledWithPage1 = postsApi.list.calls
      .allArgs()
      .some((args) => (args[0]?.page ?? 1) === 1);
    expect(calledWithPage1).toBeTrue();
  }));

  it('invalida la cache su delete e ricarica dati dopo invalidazione', fakeAsync(() => {
    const queryCache = TestBed.inject(QueryCacheService);
    spyOn(queryCache, 'invalidate').and.callThrough();

    let page1Version: 1 | 2 = 1;
    postsApi.list.and.callFake((params) => {
      const page = params?.page ?? 1;

      const page1Items =
        page1Version === 1
          ? ([{ id: 1, user_id: 2, title: 'P1', body: 'B1' }] as Post[])
          : ([{ id: 99, user_id: 2, title: 'P1-new', body: 'B1-new' }] as Post[]);

      return of({
        items:
          page === 1 ? page1Items : ([{ id: 2, user_id: 2, title: 'P2', body: 'B2' }] as Post[]),
        pagination: { total: 20, pages: 2, page, limit: 10 },
      });
    });

    const store = TestBed.inject(PostsStoreAdapter);
    tick(0);
    flushMicrotasks();
    expect(store.posts().map((p) => p.id)).toEqual([1]);

    store.setPage(2);
    tick(0);
    flushMicrotasks();
    expect(store.posts().map((p) => p.id)).toEqual([2]);

    store.setPage(1);
    tick(0);
    flushMicrotasks();
    expect(store.posts().map((p) => p.id)).toEqual([1]);

    page1Version = 2;
    store.deletePostRequest({ id: 1, user_id: 2, title: 'P1', body: 'B1' } as Post).subscribe();
    tick();

    expect(queryCache.invalidate).toHaveBeenCalledWith('posts|');

    store.setPage(1);
    tick(0);
    flushMicrotasks();
    expect(store.posts().map((p) => p.id)).toEqual([99]);
  }));
});
