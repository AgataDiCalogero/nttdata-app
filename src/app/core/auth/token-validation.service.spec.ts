import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TokenValidationService } from './token-validation.service';

describe('TokenValidationService', () => {
  let service: TokenValidationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TokenValidationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TokenValidationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('ritorna success per 200/204/422', () => {
    const statuses = [200, 204, 422];

    statuses.forEach((status) => {
      service.validate('token-123').subscribe((result) => {
        expect(result.success).toBeTrue();
      });
      const req = httpMock.expectOne('/users');
      expect(req.request.method).toBe('POST');
      req.flush({}, { status, statusText: 'OK' });
    });
  });

  it('ritorna unauthorized per 401', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('unauthorized');
    });

    const req = httpMock.expectOne('/users');
    req.flush({ message: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('mappa rate-limit e errori di rete correttamente', () => {
    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('rate_limited');
    });
    const rateReq = httpMock.expectOne('/users');
    rateReq.flush({ message: 'too many' }, { status: 429, statusText: 'Too Many Requests' });

    service.validate('token-123').subscribe((result) => {
      expect(result.success).toBeFalse();
      expect(result.code).toBe('network');
    });
    const netReq = httpMock.expectOne('/users');
    netReq.error(new ErrorEvent('NetworkError'));
  });
});
