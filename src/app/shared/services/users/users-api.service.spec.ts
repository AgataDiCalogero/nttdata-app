import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type { UserDto } from '@/app/shared/models/dto/user.dto';

import { UsersApiService } from './users-api.service';

describe('UsersApiService', () => {
  let service: UsersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should list users with caching when enabled', () => {
    // Arrange
    let firstResult = 0;
    let secondResult = 0;

    // Act
    service.list({ page: 1, name: 'John' }, { cache: true }).subscribe((resp) => {
      firstResult = resp.items.length;
    });
    service.list({ page: 1, name: 'John' }, { cache: true }).subscribe((resp) => {
      secondResult = resp.items.length;
    });

    // Assert
    const req = httpMock.expectOne(
      (r) => r.url === '/users' && r.params.get('page') === '1' && r.params.get('name') === 'John',
    );
    req.flush([{ id: 1, name: 'John', email: 'john@example.com' } as UserDto], {
      headers: {
        'X-Pagination-Total': '1',
        'X-Pagination-Limit': '1',
      },
    });

    expect(firstResult).toBe(1);
    expect(secondResult).toBe(1); // comes from cached observable, no second HTTP call
  });

  it('should create a user and clear the list cache', () => {
    // Arrange
    const payload = { name: 'Alice', email: 'alice@example.com', status: 'active' as const };
    let createdName = '';

    // Prime cache
    service.list({}, { cache: true }).subscribe();
    const listReq = httpMock.expectOne('/users');
    listReq.flush([]);

    // Act
    service.create(payload).subscribe((user) => (createdName = user.name));

    // Assert
    const req = httpMock.expectOne('/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
      gender: 'male',
      status: 'active',
    });
    req.flush({
      id: 10,
      name: 'Alice',
      email: 'alice@example.com',
      status: 'active',
    } as UserDto);

    // Cache cleared: another list should trigger a fresh HTTP call
    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users');
    expect(createdName).toBe('Alice');
  });

  it('should update a user and return mapped entity', () => {
    // Arrange
    let newEmail = '';

    // Act
    service.update(5, { email: '  new@example.com ' }).subscribe((user) => {
      newEmail = user.email;
    });

    // Assert
    const req = httpMock.expectOne('/users/5');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(jasmine.objectContaining({ email: 'new@example.com' }));
    req.flush({ id: 5, name: 'Test', email: 'new@example.com' } as UserDto);
    expect(newEmail).toBe('new@example.com');
  });

  it('should delete a user and clear cache', () => {
    // Arrange
    service.list({}, { cache: true }).subscribe();
    const listReq = httpMock.expectOne('/users');
    listReq.flush([]);

    // Act
    service.delete(3).subscribe();

    // Assert
    const req = httpMock.expectOne('/users/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    // cache cleared -> next list triggers request
    service.list({}, { cache: true }).subscribe();
    httpMock.expectOne('/users');
  });
});
