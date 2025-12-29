import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Title } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  Mail,
  User as UserIcon,
  MessageSquare,
  ArrowLeft,
  FileText,
} from 'lucide-angular';
import { of, throwError } from 'rxjs';

import { CommentsFacadeService } from '@/app/features/pages/posts/components/post-comments/post-comments-facade/comments-facade.service';
import { PostCommentsDialogService } from '@/app/features/pages/posts/services/post-comments-dialog.service';
import { UsersFacadeService } from '@/app/features/pages/users/store/users-facade.service';
import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import { Post } from '@/app/shared/models/post';
import { User } from '@/app/shared/models/user';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import { UserDetail } from './user-detail.component';

describe('UserDetailComponent', () => {
  let component: UserDetail;
  let fixture: ComponentFixture<UserDetail>;

  let usersApiSpy: jasmine.SpyObj<UsersApiService>;
  let postsApiSpy: jasmine.SpyObj<PostsApiService>;
  let commentsCacheSpy: jasmine.SpyObj<CommentsCacheService>;
  let notificationsSpy: jasmine.SpyObj<NotificationsService>;
  let i18nSpy: jasmine.SpyObj<I18nService>;
  let titleSpy: jasmine.SpyObj<Title>;
  let commentsDialogSpy: jasmine.SpyObj<PostCommentsDialogService>;
  const routeStub = { snapshot: { paramMap: { get: () => '1' } } };
  let createComponent: () => void;

  const mockUser: User = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    gender: 'male',
    status: 'active',
  };
  const mockPosts: Post[] = [{ id: 101, user_id: 1, title: 'Post 1', body: 'Body 1' }];

  beforeEach(async () => {
    usersApiSpy = jasmine.createSpyObj('UsersApiService', ['getById', 'update']);
    postsApiSpy = jasmine.createSpyObj('PostsApiService', ['list']);
    commentsCacheSpy = jasmine.createSpyObj('CommentsCacheService', [
      'fetchCommentCount',
      'fetchComments',
      'hasFreshCount',
      'setComments',
      'prefetchCounts',
    ]);
    notificationsSpy = jasmine.createSpyObj('NotificationsService', ['showHttpError']);
    i18nSpy = jasmine.createSpyObj('I18nService', ['translate']);
    titleSpy = jasmine.createSpyObj('Title', ['setTitle']);
    commentsDialogSpy = jasmine.createSpyObj('PostCommentsDialogService', ['open']);

    usersApiSpy.getById.and.returnValue(of(mockUser));
    postsApiSpy.list.and.returnValue(
      of({ items: mockPosts, pagination: { total: 1, pages: 1, page: 1, limit: 10 } }),
    );
    commentsCacheSpy.fetchCommentCount.and.returnValue(of(5));
    commentsCacheSpy.hasFreshCount.and.returnValue(false);
    commentsCacheSpy.prefetchCounts.and.returnValue(of({ 101: 5 }));
    i18nSpy.translate.and.callFake((key) => key);
    spyOn(console, 'error').and.stub();

    await TestBed.configureTestingModule({
      imports: [
        UserDetail,
        MatCardModule,
        MatProgressBarModule,
        LucideAngularModule.pick({ Mail, UserIcon, MessageSquare, ArrowLeft, FileText }),
      ],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: UsersApiService, useValue: usersApiSpy },
        { provide: PostsApiService, useValue: postsApiSpy },
        { provide: CommentsCacheService, useValue: commentsCacheSpy },
        { provide: NotificationsService, useValue: notificationsSpy },
        { provide: I18nService, useValue: i18nSpy },
        { provide: Title, useValue: titleSpy },
        CommentsFacadeService,
        UsersFacadeService,
        { provide: PostCommentsDialogService, useValue: commentsDialogSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    createComponent = () => {
      fixture = TestBed.createComponent(UserDetail);
      component = fixture.componentInstance;
    };
  });

  afterEach(() => {
    routeStub.snapshot.paramMap.get = () => '1';
  });

  it('should load user and posts on init', fakeAsync(() => {
    createComponent();
    fixture.detectChanges();
    tick();

    expect(usersApiSpy.getById).toHaveBeenCalledWith(1, { skipGlobalError: true });
    expect(postsApiSpy.list).toHaveBeenCalled();
    expect(component.user()).toEqual(mockUser);
    expect(component.posts()).toEqual(mockPosts);
    expect(component.loading()).toBeFalse();
  }));

  it('should handle invalid user id', () => {
    routeStub.snapshot.paramMap.get = () => 'invalid';
    createComponent();

    fixture.detectChanges();

    expect(component.error()).toBe('userDetail.invalidUserId');
    expect(usersApiSpy.getById).not.toHaveBeenCalled();
  });

  it('should handle user load error', fakeAsync(() => {
    usersApiSpy.getById.and.returnValue(throwError(() => new Error('API Error')));
    notificationsSpy.showHttpError.and.returnValue('Error Message');

    createComponent();
    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('userDetail.unableToLoadUser');
    expect(notificationsSpy.showHttpError).toHaveBeenCalled();
    expect(component.user()).toBeNull();
    expect(component.loading()).toBeFalse();
  }));

  it('should prefetch comment counts for posts', fakeAsync(() => {
    createComponent();
    fixture.detectChanges();
    tick();

    expect(commentsCacheSpy.prefetchCounts).toHaveBeenCalledWith([101]);
    expect(component.commentsCount()[101]).toBe(5);
  }));

  it('opens comments dialog for a post', () => {
    createComponent();
    fixture.detectChanges();

    const post = mockPosts[0];
    component.handleViewComments(post);
    expect(commentsDialogSpy.open).toHaveBeenCalledWith(post, mockUser.name, {
      allowManage: false,
    });
  });

  it('should clear postsLoading and keep UI stable when posts fail to load', fakeAsync(() => {
    postsApiSpy.list.and.returnValue(throwError(() => new Error('posts failed')));
    notificationsSpy.showHttpError.and.returnValue('posts error');

    createComponent();
    fixture.detectChanges();
    tick();

    expect(component.postsLoading()).toBeFalse();
    expect(component.posts()).toEqual([]);
    expect(notificationsSpy.showHttpError).toHaveBeenCalledWith(
      jasmine.any(Error),
      'userDetail.unableToLoadPosts',
      { silent: true },
    );
  }));
});
