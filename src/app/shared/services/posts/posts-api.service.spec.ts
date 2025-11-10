import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { PostDto, CommentDto } from '@/app/shared/models/dto/post.dto';

import { PostsApiService } from './posts-api.service';

describe('PostsApiService', () => {
  let service: PostsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PostsApiService,
        // HttpClient reale + abilita gli intercettori definiti via DI (se presenti)
        provideHttpClient(withInterceptorsFromDi()),
        // Backend di test + HttpTestingController
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PostsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should list posts with query params and map pagination headers', () => {
    // Arrange
    const params = { page: 2, perPage: 5, userId: 7, title: 'Angular' };
    const dtoList: PostDto[] = [{ id: 1, user_id: 7, title: 'A', body: 'B' }];
    let responseItemsLength = 0;

    // Act
    service.list(params).subscribe((resp) => (responseItemsLength = resp.items.length));

    // Assert
    const req = httpMock.expectOne(
      (r) =>
        r.url === '/posts' &&
        r.params.get('page') === '2' &&
        r.params.get('per_page') === '5' &&
        r.params.get('user_id') === '7' &&
        r.params.get('title') === 'Angular',
    );
    req.flush(dtoList, {
      headers: {
        'X-Pagination-Total': '10',
        'X-Pagination-Limit': '5',
        'X-Pagination-Page': '2',
        'X-Pagination-Pages': '2',
      },
    });
    expect(responseItemsLength).toBe(1);
  });

  it('should create a post using mapped DTO and return the mapped entity', () => {
    // Arrange
    const payload = { user_id: 1, title: '  Draft ', body: ' Body ' };
    const dto: PostDto = { id: 9, user_id: 1, title: 'Draft', body: 'Body' };
    let resultTitle = '';

    // Act
    service.create(payload).subscribe((post) => (resultTitle = post.title));

    // Assert
    const req = httpMock.expectOne('/posts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user_id: 1, title: 'Draft', body: 'Body' });
    req.flush(dto);
    expect(resultTitle).toBe('Draft');
  });

  it('should count comments preferring pagination header and fallback to body length', () => {
    // Arrange
    let countHeader = 0;
    let countBody = 0;

    service.countComments(3).subscribe((count) => (countHeader = count));
    service.countComments(4).subscribe((count) => (countBody = count));

    // Assert
    const headerReq = httpMock.expectOne('/posts/3/comments?per_page=1');
    expect(headerReq.request.params.get('per_page')).toBe('1');
    headerReq.flush([{ id: 1 } as CommentDto], {
      headers: { 'X-Pagination-Total': '8' },
    });

    const bodyReq = httpMock.expectOne('/posts/4/comments?per_page=1');
    bodyReq.flush([{ id: 2 } as CommentDto, { id: 3 } as CommentDto], {
      headers: { 'X-Pagination-Total': 'NaN' },
    });

    expect(countHeader).toBe(8);
    expect(countBody).toBe(2);
  });

  it('should update a comment via /comments/:id endpoint', () => {
    // Arrange
    const payload = { body: '  Updated  ' };
    let updatedBody = '';

    // Act
    service.updateComment(55, payload).subscribe((comment) => (updatedBody = comment.body));

    // Assert
    const req = httpMock.expectOne('/comments/55');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ body: 'Updated' });
    req.flush({ id: 55, post_id: 1, name: '', email: '', body: 'Updated' });
    expect(updatedBody).toBe('Updated');
  });
});
