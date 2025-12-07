import { signal } from '@angular/core';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';

import { Comment, Post } from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import { PostsUiService } from './posts-ui.service';
import { Posts } from './posts.component';
import { PostsFiltersService } from './store/posts-filters.service';
import { postsServiceInjectionToken } from './store/posts.inject';

describe('PostsComponent', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;
  let mockStore: ReturnType<typeof createMockStore>;

  let routerSpy: jasmine.SpyObj<Router>;
  let uiServiceSpy: jasmine.SpyObj<PostsUiService>;
  let filtersServiceSpy: jasmine.SpyObj<PostsFiltersService>;
  let notificationsSpy: jasmine.SpyObj<NotificationsService>;

  function createMockStore() {
    const fb = new FormBuilder();
    const filtersForm = fb.group({
      title: fb.nonNullable.control(''),
      userId: fb.control<number | null>(0),
    });

    return {
      initializePaging: jasmine.createSpy('initializePaging'),
      currentPage: signal(1),
      currentPerPage: signal(10),
      resetFilters: jasmine.createSpy('resetFilters'),
      toggleComments: jasmine.createSpy('toggleComments'),
      onCommentCreated: jasmine.createSpy('onCommentCreated'),
      onCommentUpdated: jasmine.createSpy('onCommentUpdated'),
      onCommentDeleted: jasmine.createSpy('onCommentDeleted'),
      setPage: jasmine.createSpy('setPage'),
      changePerPage: jasmine.createSpy('changePerPage'),
      userLookup: signal<Record<number, string>>({ 1: 'Author' }),
      userOptions: signal([{ id: 1, name: 'Author' }]),
      posts: signal<Post[]>([{ id: 101, user_id: 1, title: 'Test Post', body: 'Body' }]),
      commentsMap: signal<Record<number, Comment[]>>({}),
      commentsLoading: signal<Record<number, boolean>>({}),
      commentsCountMap: signal<Record<number, number>>({}),
      perPageOptions: signal([10, 20]),
      totalPages: signal(1),
      hasPagination: signal(false),
      deletingId: signal<number | null>(null),
      totalPosts: signal(1),
      loading: signal(false),
      error: signal<string | null>(null),
      searchForm: signal(filtersForm),
    };
  }

  beforeEach(async () => {
    mockStore = createMockStore();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    uiServiceSpy = jasmine.createSpyObj('PostsUiService', [
      'openCreateDialog',
      'openEditDialog',
      'confirmDelete',
    ]);
    filtersServiceSpy = jasmine.createSpyObj('PostsFiltersService', [], {
      filters: signal({}),
    });
    notificationsSpy = jasmine.createSpyObj('NotificationsService', ['showInfo']);

    await TestBed.configureTestingModule({
      imports: [Posts, HttpClientTestingModule],
      providers: [
        provideNoopAnimations(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: NotificationsService, useValue: notificationsSpy },
      ],
    })
      .overrideComponent(Posts, {
        set: {
          providers: [
            { provide: postsServiceInjectionToken, useValue: mockStore },
            { provide: PostsUiService, useValue: uiServiceSpy },
            { provide: PostsFiltersService, useValue: filtersServiceSpy },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Posts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize paging from URL', () => {
    expect(mockStore.initializePaging).toHaveBeenCalled();
  });

  it('should sync query params when page changes', fakeAsync(() => {
    mockStore.currentPage.set(2);
    fixture.detectChanges();
    tick();

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { page: 2, per_page: 10 },
      }),
    );
  }));

  it('should sync query params when per page changes', fakeAsync(() => {
    routerSpy.navigate.calls.reset();

    mockStore.currentPerPage.set(25);
    fixture.detectChanges();
    tick();

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { page: 1, per_page: 25 },
      }),
    );
  }));

  it('should handle UI interactions', () => {
    const post = { id: 101 } as Post;

    component.handleCreatePost();
    expect(uiServiceSpy.openCreateDialog).toHaveBeenCalled();

    component.handleEditPost(post);
    expect(uiServiceSpy.openEditDialog).toHaveBeenCalledWith(post);

    component.handleDeletePost(post);
    expect(uiServiceSpy.confirmDelete).toHaveBeenCalledWith(post);
  });

  it('should delegate actions to store', () => {
    component.handleResetFilters();
    expect(mockStore.resetFilters).toHaveBeenCalled();

    component.handleToggleComments(101);
    expect(mockStore.toggleComments).toHaveBeenCalledWith(101);

    component.handleChangePage(3);
    expect(mockStore.setPage).toHaveBeenCalledWith(3);

    component.handleChangePerPage(20);
    expect(mockStore.changePerPage).toHaveBeenCalledWith(20);
  });

  it('should navigate to author profile if user exists', () => {
    component.handleViewAuthor(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users', 1]);
  });

  it('should show info if author not found', () => {
    component.handleViewAuthor(999);
    expect(notificationsSpy.showInfo).toHaveBeenCalled();
    expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/users', 999]);
  });

  it('should display loading state and hide posts list', () => {
    mockStore.loading.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.posts-page__loader')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-posts-list')).toBeNull();
  });

  it('should not show empty state while an error is present', () => {
    mockStore.posts.set([]);
    mockStore.error.set('boom');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.posts-page__alert')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.posts-empty')).toBeNull();
  });
});
