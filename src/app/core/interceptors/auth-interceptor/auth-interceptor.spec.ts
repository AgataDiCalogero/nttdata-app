import { HttpHandlerFn, HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../../auth/auth-service/auth.service';

describe('authInterceptor', () => {
  let auth: { token: () => string | null };
  let next: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    auth = { token: () => '  abc ' };
    next = jasmine
      .createSpy<HttpHandlerFn>('next')
      .and.callFake((req: HttpRequest<unknown>) =>
        of(new HttpResponse({ status: 200, url: req.url, headers: req.headers })),
      );

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });

  it('non sovrascrive Authorization già presente', () => {
    const req = new HttpRequest('GET', '/api', {
      headers: new HttpHeaders({ Authorization: 'Existing' }),
    });

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.headers.get('Authorization')).toBe('Existing');
  });

  it('aggiunge Bearer dal token quando presente', () => {
    const req = new HttpRequest('GET', '/secure');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('non aggiunge header quando il token è vuoto', () => {
    auth.token = () => '   ';
    const req = new HttpRequest('GET', '/open');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.headers.has('Authorization')).toBeFalse();
  });

  it('non allega Authorization a URL assolute esterne', () => {
    const req = new HttpRequest('GET', 'https://example.com/api');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.headers.has('Authorization')).toBeFalse();
  });

  it('allega Authorization a URL assolute verso la stessa origin della API', () => {
    const req = new HttpRequest('GET', 'https://gorest.co.in/public/v2/users');

    TestBed.runInInjectionContext(() => authInterceptor(req, next));

    const forwarded = next.calls.mostRecent().args[0];
    expect(forwarded.headers.get('Authorization')).toBe('Bearer abc');
  });
});
