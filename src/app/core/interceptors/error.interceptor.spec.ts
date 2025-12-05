import {
  HttpContext,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { defer, of, throwError } from 'rxjs';

import { ToastService } from '@app/shared/ui/toast/toast.service';

import { errorInterceptor } from './error.interceptor';
import { SKIP_GLOBAL_ERROR } from './http-context-tokens';
import { AuthService } from '../auth/auth-service/auth.service';

describe('errorInterceptor', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let toast: jasmine.SpyObj<ToastService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['logout']);
    toast = jasmine.createSpyObj('ToastService', ['show']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('su 401 esegue logout, mostra toast e reindirizza a /login', (done) => {
    const req = new HttpRequest('GET', '/secure');
    const next: HttpHandlerFn = () =>
      throwError(() => new HttpErrorResponse({ status: 401, url: '/secure' }));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(req, next).subscribe({
        error: () => {
          expect(auth.logout).toHaveBeenCalled();
          expect(toast.show).toHaveBeenCalledWith(
            'warning',
            'Your session expired. Please sign in again.',
            4000,
          );
          expect(router.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
      });
    });
  });

  it('su 429 ritenta la richiesta e mostra toast informativo', fakeAsync(() => {
    let attempts = 0;
    const req = new HttpRequest('GET', '/rate-limited');
    const next: HttpHandlerFn = () =>
      defer(() => {
        attempts += 1;
        if (attempts === 1) {
          return throwError(
            () =>
              new HttpErrorResponse({
                status: 429,
                headers: new HttpHeaders({ 'Retry-After': '1' }),
              }),
          );
        }
        return of(new HttpResponse({ status: 200, body: 'ok' }));
      });

    let result: HttpResponse<unknown> | undefined;
    let capturedError: unknown;
    TestBed.runInInjectionContext(() => {
      errorInterceptor(req, next).subscribe({
        next: (res) => {
          result = res as HttpResponse<unknown>;
        },
        error: (err) => {
          capturedError = err;
        },
      });
    });

    tick(1500);

    expect(result?.body).toBe('ok');
    expect(capturedError).toBeUndefined();
    expect(attempts).toBe(2);
    expect(toast.show).toHaveBeenCalledWith(
      'info',
      'Too many requests. Retrying in 1s.',
      jasmine.any(Number),
    );
  }));

  it('rispetta SKIP_GLOBAL_ERROR senza mostrare toast', (done) => {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, true);
    const ctxReq = new HttpRequest('GET', '/skip', { context });
    const next: HttpHandlerFn = () => throwError(() => new HttpErrorResponse({ status: 500 }));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(ctxReq, next).subscribe({
        error: () => {
          expect(toast.show).not.toHaveBeenCalled();
          expect(auth.logout).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
