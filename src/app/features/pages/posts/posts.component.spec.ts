import { ViewportScroller } from '@angular/common';
import { HttpClientTestingModule, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute } from '@angular/router';

import { Post } from '@/app/shared/models/post';

import { Posts } from './posts.component';
import { PostCommentsDialogService } from './services/post-comments-dialog.service';
import { PostsFiltersService } from './services/posts-filters.service';
import { PostsUiService } from './services/posts-ui.service';
import { postsServiceInjectionToken } from './store/posts.inject';

describe('PostsComponent', () => {
  let component: Posts;
  let fixture: ComponentFixture<Posts>;
  let mockStore: ReturnType<typeof createMockStore>;

  let routerSpy: jasmine.SpyObj<Router>;
  let uiServiceSpy: jasmine.SpyObj<PostsUiService>;
  let filtersServiceSpy: jasmine.SpyObj<PostsFiltersService>;
  let commentsDialogSpy: jasmine.SpyObj<PostCommentsDialogService>;
  let viewportSpy: jasmine.SpyObj<ViewportScroller>;

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
      setPage: jasmine.createSpy('setPage'),
      changePerPage: jasmine.createSpy('changePerPage'),
      userLookup: signal<Record<number, string>>({ 1: 'Author' }),
      userOptions: signal([{ id: 1, name: 'Author' }]),
      posts: signal<Post[]>([{ id: 101, user_id: 1, title: 'Test Post', body: 'Body' }]),
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
    commentsDialogSpy = jasmine.createSpyObj('PostCommentsDialogService', ['open']);
    filtersServiceSpy = jasmine.createSpyObj('PostsFiltersService', [], {
      filters: signal({}),
    });
    viewportSpy = jasmine.createSpyObj('ViewportScroller', ['scrollToPosition']);

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
        { provide: ViewportScroller, useValue: viewportSpy },
      ],
    })
      .overrideComponent(Posts, {
        set: {
          providers: [
            { provide: postsServiceInjectionToken, useValue: mockStore },
            { provide: PostsUiService, useValue: uiServiceSpy },
            { provide: PostsFiltersService, useValue: filtersServiceSpy },
            { provide: PostCommentsDialogService, useValue: commentsDialogSpy },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Posts);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

    component.handleChangePage(3);
    expect(mockStore.setPage).toHaveBeenCalledWith(3);

    component.handleChangePerPage(20);
    expect(mockStore.changePerPage).toHaveBeenCalledWith(20);
  });

  it('opens comments dialog for selected post', () => {
    const post = { id: 101, user_id: 1 } as Post;
    component.handleViewComments(post);
    expect(commentsDialogSpy.open).toHaveBeenCalledWith(post, 'Author');
  });

  it('should navigate to author profile when requested', () => {
    component.handleViewAuthor(1);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users', 1]);
  });

  it('navigates even when author is missing in lookup', () => {
    component.handleViewAuthor(999);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/users', 999]);
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

  it('should show empty state when there are no posts and no error', () => {
    mockStore.posts.set([]);
    mockStore.loading.set(false);
    mockStore.error.set(null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.posts-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-posts-list')).toBeNull();
  });

  it('scrolls to top on pagination change', fakeAsync(() => {
    mockStore.currentPage.set(2);
    fixture.detectChanges();
    tick();

    expect(viewportSpy.scrollToPosition).toHaveBeenCalledWith([0, 0]);
  }));
});
