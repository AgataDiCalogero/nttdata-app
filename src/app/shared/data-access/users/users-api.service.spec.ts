import { provideHttpClient, withInterceptorsFromDi, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { UserDto } from '@/app/shared/models/dto/user.dto';

import { UsersApiService } from './users-api.service';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UsersApiService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(UsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('maps pagination headers and falls back to body length', () => {
    let headerPagination: number | undefined;
    let fallbackPagination: number | undefined;

    service.list({ page: 2, perPage: 5 }).subscribe((resp) => {
      headerPagination = resp.pagination?.total;
    });
    const headerReq = httpMock.expectOne(
      (r) => r.url === '/users' && r.params.get('page') === '2' && r.params.get('per_page') === '5',
    );
    headerReq.flush(
      [{ id: 1, name: 'A', email: 'a@example.com', status: 'active' } satisfies UserDto],
      {
        headers: {
          'X-Pagination-Total': '10',
          'X-Pagination-Limit': '5',
          'X-Pagination-Page': '2',
          'X-Pagination-Pages': '2',
        },
      },
    );

    service.list({}).subscribe((resp) => {
      fallbackPagination = resp.pagination?.total;
    });
    const fallbackReq = httpMock.expectOne('/users');
    fallbackReq.flush([
      { id: 2, name: 'B', email: 'b@example.com', status: 'inactive' } as UserDto,
    ]);

    expect(headerPagination).toBe(10);
    expect(fallbackPagination).toBe(1);
  });

  it('returns mapped entity on getById', () => {
    let resultEmail = '';

    service.getById(7).subscribe((user) => (resultEmail = user.email));

    const req = httpMock.expectOne('/users/7');
    expect(req.request.method).toBe('GET');
    req.flush({
      id: 7,
      name: '  Test ',
      email: ' Mixed@Example.Com ',
      status: 'active',
    } as UserDto);

    expect(resultEmail).toBe('Mixed@Example.Com');
  });

  it('creates user with normalized payload and clears cache', () => {
    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users').flush([]);

    let createdId = 0;
    service
      .create({ name: ' Alice ', email: ' Alice@ExAmple.Com ', status: 'inactive' })
      .subscribe((user) => {
        createdId = user.id;
      });

    const req = httpMock.expectOne('/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      gender: 'male',
      status: 'inactive',
    });
    req.flush({ id: 42, name: 'Alice', email: 'alice@example.com', status: 'inactive' } as UserDto);

    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users');
    expect(createdId).toBe(42);
  });

  it('updates user with trimmed/lowercased fields and clears cache', () => {
    let returnedName = '';

    service.update(5, { name: '  Bob  ', email: ' BOB@EXAMPLE.COM ' }).subscribe((user) => {
      returnedName = user.name;
    });

    const req = httpMock.expectOne('/users/5');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ name: 'Bob', email: 'bob@example.com' }),
    );
    req.flush({ id: 5, name: 'Bob', email: 'bob@example.com', status: 'active' } as UserDto);

    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users');
    expect(returnedName).toBe('Bob');
  });

  it('deletes user and clears cache', () => {
    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users').flush([]);

    service.delete(9).subscribe();

    const req = httpMock.expectOne('/users/9');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users');
  });

  it('drops cache entry on error responses', () => {
    service.list({ page: 1 }, { cache: true }).subscribe({
      error: () => void 0,
    });
    const req = httpMock.expectOne((r) => r.url === '/users');
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Server Error' });

    service.list({ page: 1 }, { cache: true }).subscribe({
      error: () => void 0,
    });
    httpMock
      .expectOne((r) => r.url === '/users')
      .flush([], {
        headers: { 'X-Pagination-Total': '0', 'X-Pagination-Limit': '1' },
      });

    expect(true).toBeTrue();
  });

  it('propagates specific HTTP errors (401/403/429/422/500)', () => {
    const statuses = [401, 403, 422, 429, 500];

    for (const status of statuses) {
      service.list().subscribe({
        next: () => fail(`expected error ${status}`),
        error: (err: HttpErrorResponse) => expect(err.status).toBe(status),
      });
      httpMock
        .expectOne((req) => req.url === '/users')
        .flush({ message: 'error' }, { status, statusText: 'Error' });
    }
  });
});
