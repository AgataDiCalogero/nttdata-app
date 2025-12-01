import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';

import { Post } from '@/app/shared/models/post';
import { NotificationsService } from '@/app/shared/services/notifications/notifications.service';

import { PostsUiService } from './posts-ui.service';
import { Posts } from './posts.component';
import { PostsFiltersService } from './store/posts-filters.service';
import { injectPostsService } from './store/posts.inject';

describe('PostsComponent', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;

  let routerSpy: jasmine.SpyObj<Router>;
  let uiServiceSpy: jasmine.SpyObj<PostsUiService>;
  let filtersServiceSpy: jasmine.SpyObj<PostsFiltersService>;
  let notificationsSpy: jasmine.SpyObj<NotificationsService>;

  // Mock Store
  const mockStore = {
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
    userLookup: signal<Record<number, any>>({ 1: { id: 1, name: 'Author' } }),
    posts: signal<Post[]>([{ id: 101, user_id: 1, title: 'Test Post', body: 'Body' }]),
    loading: signal(false),
    error: signal(null),
    total: signal(1),
  };

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
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
      imports: [Posts, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => null } } },
        },
        { provide: PostsUiService, useValue: uiServiceSpy },
        { provide: PostsFiltersService, useValue: filtersServiceSpy },
        { provide: NotificationsService, useValue: notificationsSpy },
      ],
    })
      .overrideProvider(injectPostsService, { useValue: () => mockStore })
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
});
