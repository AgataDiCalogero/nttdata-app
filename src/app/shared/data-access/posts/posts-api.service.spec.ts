import { provideHttpClient, withInterceptorsFromDi, HttpErrorResponse } from '@angular/common/http';
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
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PostsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists posts with query params and maps pagination headers', () => {
    const params = { page: 2, perPage: 5, userId: 7, title: 'Angular' };
    const dtoList: PostDto[] = [{ id: 1, user_id: 7, title: 'A', body: 'B' }];
    let paginationLimit: number | undefined;

    service.list(params).subscribe((resp) => {
      paginationLimit = resp.pagination?.limit;
    });

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
    expect(paginationLimit).toBe(5);
  });

  it('falls back to body length when pagination headers are missing', () => {
    let total = 0;

    service.list().subscribe((resp) => {
      total = resp.pagination?.total ?? 0;
    });

    const req = httpMock.expectOne('/posts');
    req.flush([{ id: 1, user_id: 1, title: 'X', body: 'Y' } as PostDto]);

    expect(total).toBe(1);
  });

  it('retrieves a post by id and maps DTO', () => {
    let title = '';

    service.getById(12).subscribe((post) => (title = post.title));

    const req = httpMock.expectOne('/posts/12');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 12, user_id: 4, title: ' Hello ', body: ' World ' } as PostDto);

    expect(title).toBe(' Hello ');
  });

  it('creates, updates and deletes posts with normalized payloads', () => {
    let createdId = 0;
    service.create({ user_id: 1, title: ' Draft ', body: ' Body ' }).subscribe((post) => {
      createdId = post.id;
    });
    const createReq = httpMock.expectOne('/posts');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({ user_id: 1, title: 'Draft', body: 'Body' });
    createReq.flush({ id: 99, user_id: 1, title: 'Draft', body: 'Body' } as PostDto);

    let updatedTitle = '';
    service.update(99, { title: '  Updated ', body: '  Body2 ' }).subscribe((post) => {
      updatedTitle = post.title;
    });
    const updateReq = httpMock.expectOne('/posts/99');
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body).toEqual({ title: 'Updated', body: 'Body2' });
    updateReq.flush({ id: 99, user_id: 1, title: 'Updated', body: 'Body2' } as PostDto);

    service.delete(99).subscribe();
    const deleteReq = httpMock.expectOne('/posts/99');
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);

    expect(createdId).toBe(99);
    expect(updatedTitle).toBe('Updated');
  });

  it('lists comments and maps DTOs', () => {
    let commentsCount = 0;

    service.listComments(5).subscribe((comments) => (commentsCount = comments.length));

    const req = httpMock.expectOne('/posts/5/comments');
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, post_id: 5, name: 'n', email: 'e', body: 'b' } as CommentDto,
      { id: 2, post_id: 5, name: 'n2', email: 'e2', body: 'b2' } as CommentDto,
    ]);

    expect(commentsCount).toBe(2);
  });

  it('counts comments preferring header total then body length and uses per_page=1', () => {
    let countHeader = 0;
    let countBody = 0;

    service.countComments(3).subscribe((count) => (countHeader = count));
    const headerReq = httpMock.expectOne('/posts/3/comments?per_page=1');
    expect(headerReq.request.params.get('per_page')).toBe('1');
    headerReq.flush([{ id: 1 } as CommentDto], { headers: { 'X-Pagination-Total': '8' } });

    service.countComments(4).subscribe((count) => (countBody = count));
    const bodyReq = httpMock.expectOne('/posts/4/comments?per_page=1');
    bodyReq.flush(
      [
        { id: 2, post_id: 4, name: '', email: '', body: '' } as CommentDto,
        { id: 3, post_id: 4, name: '', email: '', body: '' } as CommentDto,
      ],
      { headers: { 'X-Pagination-Total': 'NaN' } },
    );

    expect(countHeader).toBe(8);
    expect(countBody).toBe(2);
  });

  it('updates a comment via /comments/:id endpoint with trimmed body', () => {
    let body = '';

    service
      .updateComment(55, { body: '  Updated  ' })
      .subscribe((comment) => (body = comment.body));

    const req = httpMock.expectOne('/comments/55');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ body: 'Updated' });
    req.flush({ id: 55, post_id: 1, name: '', email: '', body: 'Updated' });

    expect(body).toBe('Updated');
  });

  it('propagates errors for CRUD/list operations (401/429/500)', () => {
    const statuses = [401, 429, 500];

    for (const status of statuses) {
      service.list().subscribe({
        next: () => fail(`expected error ${status}`),
        error: (err: HttpErrorResponse) => expect(err.status).toBe(status),
      });
      httpMock.expectOne('/posts').flush({ message: 'error' }, { status, statusText: 'Error' });
    }
  });
});
