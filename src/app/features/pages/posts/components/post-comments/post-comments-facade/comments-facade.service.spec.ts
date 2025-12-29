import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { Comment } from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import { CommentsFacadeService } from './comments-facade.service';

describe('CommentsFacadeService', () => {
  let postsApi: jasmine.SpyObj<PostsApiService>;
  let cache: CommentsCacheService;
  let facade: CommentsFacadeService;

  beforeEach(() => {
    postsApi = jasmine.createSpyObj('PostsApiService', [
      'countComments',
      'listComments',
      'createComment',
      'updateComment',
      'deleteComment',
    ]);
    postsApi.countComments.and.returnValue(of(5));
    postsApi.listComments.and.returnValue(of([] as Comment[]));
    postsApi.createComment.and.returnValue(
      of({ id: 1, post_id: 1, name: 'n', email: 'e', body: 'b' } as Comment),
    );
    postsApi.updateComment.and.returnValue(
      of({ id: 1, post_id: 1, name: 'n', email: 'e', body: 'b' } as Comment),
    );
    postsApi.deleteComment.and.returnValue(of(void 0));

    const notifications = jasmine.createSpyObj<NotificationsService>('NotificationsService', [
      'showHttpError',
    ]);
    notifications.showHttpError.and.callFake((_e: unknown, msg: string) => msg);
    const i18n = jasmine.createSpyObj<I18nService>('I18nService', ['translate']);
    i18n.translate.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: PostsApiService, useValue: postsApi },
        { provide: NotificationsService, useValue: notifications },
        { provide: I18nService, useValue: i18n },
        CommentsCacheService,
        CommentsFacadeService,
      ],
    });

    cache = TestBed.inject(CommentsCacheService);
    facade = TestBed.inject(CommentsFacadeService);
  });

  it('prefetchCounts does not call the API when counts are fresh in cache', async () => {
    await firstValueFrom(cache.fetchCommentCount(1));
    expect(postsApi.countComments).toHaveBeenCalledTimes(1);

    await facade.prefetchCounts([{ id: 1 }]);
    expect(postsApi.countComments).toHaveBeenCalledTimes(1);
  });
});
