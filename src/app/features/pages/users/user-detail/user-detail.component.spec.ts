import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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

import { UsersFacadeService } from '@/app/features/pages/users/store/users-facade.service';
import { CommentsCacheService } from '@/app/shared/data-access/comments/comments-cache.service';
import { PostsApiService } from '@/app/shared/data-access/posts/posts-api.service';
import { UsersApiService } from '@/app/shared/data-access/users/users-api.service';
import { I18nService } from '@/app/shared/i18n/i18n.service';
import { Post } from '@/app/shared/models/post';
import { User } from '@/app/shared/models/user';
import { CommentsFacadeService } from '@/app/shared/services/comments/comments-facade.service';
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
      'setComments',
      'prefetchCounts',
    ]);
    notificationsSpy = jasmine.createSpyObj('NotificationsService', ['showHttpError']);
    i18nSpy = jasmine.createSpyObj('I18nService', ['translate']);

    // Default mocks
    usersApiSpy.getById.and.returnValue(of(mockUser));
    postsApiSpy.list.and.returnValue(
      of({ items: mockPosts, pagination: { total: 1, pages: 1, page: 1, limit: 10 } }),
    );
    commentsCacheSpy.fetchCommentCount.and.returnValue(of(5));
    commentsCacheSpy.prefetchCounts.and.returnValue(of({ 101: 5 }));
    i18nSpy.translate.and.callFake((key) => key);

    await TestBed.configureTestingModule({
      imports: [
        UserDetail,
        MatCardModule,
        MatProgressBarModule,
        NoopAnimationsModule,
        LucideAngularModule.pick({ Mail, UserIcon, MessageSquare, ArrowLeft, FileText }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        { provide: UsersApiService, useValue: usersApiSpy },
        { provide: PostsApiService, useValue: postsApiSpy },
        { provide: CommentsCacheService, useValue: commentsCacheSpy },
        { provide: NotificationsService, useValue: notificationsSpy },
        { provide: I18nService, useValue: i18nSpy },
        CommentsFacadeService,
        UsersFacadeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load user and posts on init', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // allow signals to settle

    expect(usersApiSpy.getById).toHaveBeenCalledWith(1);
    expect(postsApiSpy.list).toHaveBeenCalled();
    expect(component.user()).toEqual(mockUser);
    expect(component.posts()).toEqual(mockPosts);
    expect(component.loading()).toBeFalse();
  }));

  it('should handle invalid user id', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UserDetail, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'invalid' } } } },
        { provide: UsersApiService, useValue: usersApiSpy },
        { provide: PostsApiService, useValue: postsApiSpy },
        { provide: CommentsCacheService, useValue: commentsCacheSpy },
        { provide: NotificationsService, useValue: notificationsSpy },
        { provide: I18nService, useValue: i18nSpy },
        CommentsFacadeService,
        UsersFacadeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const localFixture = TestBed.createComponent(UserDetail);
    const localComponent = localFixture.componentInstance;

    localFixture.detectChanges();

    expect(localComponent.error()).toBe('userDetail.invalidUserId');
    expect(usersApiSpy.getById).not.toHaveBeenCalled();
  });

  it('should handle user load error', fakeAsync(() => {
    usersApiSpy.getById.and.returnValue(throwError(() => new Error('API Error')));
    notificationsSpy.showHttpError.and.returnValue('Error Message');

    fixture.detectChanges();
    tick();

    expect(component.error()).toBe('userDetail.unableToLoadUser');
    expect(notificationsSpy.showHttpError).toHaveBeenCalled();
    expect(component.user()).toBeNull();
    expect(component.loading()).toBeFalse();
  }));

  it('should prefetch comment counts for posts', fakeAsync(() => {
    fixture.detectChanges();
    tick(); // wait for effects

    expect(commentsCacheSpy.prefetchCounts).toHaveBeenCalledWith([101]);
    expect(component.commentsCount()[101]).toBe(5);
  }));

  it('should toggle comments visibility', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // Open comments
    const comments = [{ id: 1, post_id: 101, name: 'C1', email: 'e@e.com', body: 'Comment 1' }];
    commentsCacheSpy.fetchComments.and.returnValue(of(comments));

    component.onToggleComments(101);
    tick();

    expect(component.commentsFor(101)).toEqual(comments);
    expect(component.commentsLoaded(101)).toBeTrue();

    // Close comments
    component.onToggleComments(101);
    expect(component.commentsLoaded(101)).toBeFalse();
  }));

  it('should update user status optimistically', () => {
    fixture.detectChanges();

    usersApiSpy.update.and.returnValue(of({ ...mockUser, status: 'inactive' }));

    component.onStatusChange('inactive');

    expect(component.user()?.status).toBe('inactive');
    expect(usersApiSpy.update).toHaveBeenCalledWith(1, { status: 'inactive' });
  });

  it('should revert user status on error', () => {
    fixture.detectChanges();
    usersApiSpy.update.and.returnValue(throwError(() => new Error('Update failed')));

    component.onStatusChange('inactive');

    // Should revert to active (mockUser default)
    expect(component.user()?.status).toBe('active');
    expect(notificationsSpy.showHttpError).toHaveBeenCalled();
  });

  it('should handle comment fetch errors without crashing UI', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    const error = new Error('comments failed');
    commentsCacheSpy.fetchComments.and.returnValue(throwError(() => error));
    notificationsSpy.showHttpError.and.returnValue('unable to load comments');

    component.onToggleComments(101);
    tick();

    expect(component.commentsLoaded(101)).toBeFalse();
    expect(notificationsSpy.showHttpError).toHaveBeenCalledWith(
      error,
      'userDetail.unableToLoadComments',
    );
  }));

  it('should clear postsLoading and keep UI stable when posts fail to load', fakeAsync(() => {
    postsApiSpy.list.and.returnValue(throwError(() => new Error('posts failed')));
    notificationsSpy.showHttpError.and.returnValue('posts error');

    fixture.detectChanges();
    tick();

    expect(component.postsLoading()).toBeFalse();
    expect(component.posts()).toEqual([]);
    expect(notificationsSpy.showHttpError).toHaveBeenCalledWith(
      jasmine.any(Error),
      'userDetail.unableToLoadPosts',
    );
  }));
});
