import { HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { apiPrefixInterceptor } from './api-prefix.interceptor';

describe('apiPrefixInterceptor', () => {
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    next = jasmine
      .createSpy<HttpHandlerFn>('next')
      .and.callFake((req: HttpRequest<unknown>) =>
        of(new HttpResponse({ status: 200, url: req.url })),
      );
  });

  it('prefixa le URL relative con environment.baseUrl', () => {
    const req = new HttpRequest('GET', '/users');

    TestBed.runInInjectionContext(() => apiPrefixInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.url).toContain('https://gorest.co.in/public/v2/users');
  });

  it('non modifica le URL assolute', () => {
    const absolute = 'https://example.com/api';
    const req = new HttpRequest('GET', absolute);

    TestBed.runInInjectionContext(() => apiPrefixInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.url).toBe(absolute);
  });
});
