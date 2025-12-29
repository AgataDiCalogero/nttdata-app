import {
  HttpContext,
  HttpErrorResponse,
  HttpHeaders,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { errorInterceptor } from './error.interceptor';
import { SKIP_GLOBAL_ERROR } from './http-context-tokens';
import { AuthService } from '../../auth/auth-service/auth.service';

describe('errorInterceptor', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockToast: jasmine.SpyObj<ToastService>;
  let mockI18n: jasmine.SpyObj<I18nService>;
  let mockNext: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuth = jasmine.createSpyObj('AuthService', ['logout']);
    mockToast = jasmine.createSpyObj('ToastService', ['show']);
    mockI18n = jasmine.createSpyObj('I18nService', ['translate']);
    mockNext = jasmine.createSpy('HttpHandlerFn');

    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    mockI18n.translate.and.callFake((key: string) => key);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
        { provide: I18nService, useValue: mockI18n },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('should handle 401 unauthorized errors', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockAuth.logout).toHaveBeenCalled();
          expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          expect(mockToast.show).toHaveBeenCalledWith('warning', jasmine.any(String), 4000);
          done();
        },
      });
    });
  });

  it('should handle 403 forbidden errors', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockToast.show).toHaveBeenCalledWith('error', jasmine.any(String), 4000);
          done();
        },
      });
    });
  });

  it('should handle network errors', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockToast.show).toHaveBeenCalledWith('error', jasmine.any(String), 4000);
          done();
        },
      });
    });
  });

  it('should pass through successful requests', (done) => {
    const request = new HttpRequest('GET', '/api/test');
    const response = new HttpResponse({ body: { data: 'success' } });
    mockNext.and.returnValue(of<HttpEvent<unknown>>(response));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        next: (res) => {
          expect(res).toEqual(response);
          expect(mockToast.show).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('should skip global error handling when context flag is set', (done) => {
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, true);
    const request = new HttpRequest('GET', '/api/test').clone({ context });
    const error = new HttpErrorResponse({ status: 500 });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockNext.calls.count()).toBe(1);
          expect(mockToast.show).not.toHaveBeenCalled();
          expect(mockAuth.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('should skip global error handling when header flag is set', (done) => {
    const headers = new HttpHeaders({ 'X-Skip-Global-Error': 'true' });
    const request = new HttpRequest('GET', '/api/test').clone({ headers });
    const error = new HttpErrorResponse({
      status: 429,
      headers: new HttpHeaders({ 'Retry-After': '1' }),
    });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockNext.calls.count()).toBe(1);
          expect(mockToast.show).not.toHaveBeenCalled();
          expect(mockAuth.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('does not perform UI side-effects on the server', (done) => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
        { provide: I18nService, useValue: mockI18n },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          expect(mockToast.show).not.toHaveBeenCalled();
          expect(mockAuth.logout).not.toHaveBeenCalled();
          expect(mockRouter.navigate).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
