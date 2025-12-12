import { HttpHeaders, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TokenValidationService } from './token-validation.service';
import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context-tokens';

describe('TokenValidationService', () => {
  let service: TokenValidationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TokenValidationService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TokenValidationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('short-circuits with empty token', () => {
    service.validate('   ').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('empty');
    });

    httpMock.expectNone('/users');
  });

  it('invokes /users with auth header and returns success on 200', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeTrue();
    });

    const req = httpMock.expectOne((r) => r.url === '/users');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    expect(req.request.context.get(SKIP_GLOBAL_ERROR)).toBeTrue();
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('per_page')).toBe('1');
    req.flush({}, { status: 200, statusText: 'OK' });
  });

  it('maps 401 and 422 to unauthorized', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('unauthorized');
      expect(result.message).toContain('invalid or expired');
    });
    const unauthorizedReq = httpMock.expectOne((r) => r.url === '/users');
    unauthorizedReq.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    service.validate('token-456').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('unauthorized');
      expect(result.message).toContain('could not be validated');
    });
    const unprocessableReq = httpMock.expectOne((r) => r.url === '/users');
    unprocessableReq.flush(
      { message: 'invalid' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
  });

  it('maps rate limit and network errors', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('rate_limited');
      expect(result.message).toContain('Too many requests');
      expect(result.retryAfterMs).toBe(3000);
      expect(result.message).toContain('3s');
    });
    const rateReq = httpMock.expectOne((r) => r.url === '/users');
    rateReq.flush(
      { message: 'too many' },
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: new HttpHeaders({ 'Retry-After': '3' }),
      },
    );

    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('network');
    });
    const netReq = httpMock.expectOne((r) => r.url === '/users');
    netReq.error(new ErrorEvent('NetworkError'), { status: 0, statusText: 'Network Error' });
  });

  it('maps unexpected errors to unknown', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('unknown');
      expect(result.message).toContain('Unable to verify');
    });
    const req = httpMock.expectOne((r) => r.url === '/users');
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});
