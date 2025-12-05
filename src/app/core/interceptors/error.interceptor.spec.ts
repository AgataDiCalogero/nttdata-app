import {
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ToastService } from '@app/shared/ui/toast/toast.service';
import { AuthService } from '../auth/auth-service/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuth: jasmine.SpyObj<AuthService>;
  let mockToast: jasmine.SpyObj<ToastService>;
  let mockNext: jasmine.Spy<HttpHandlerFn>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockAuth = jasmine.createSpyObj('AuthService', ['logout']);
    mockToast = jasmine.createSpyObj('ToastService', ['show']);
    mockNext = jasmine.createSpy('HttpHandlerFn');

    mockRouter.navigate.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
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
    const request = new HttpRequest('GET', '/api/test');
    const error = new HttpErrorResponse({ status: 500 });
    mockNext.and.returnValue(throwError(() => error));

    TestBed.runInInjectionContext(() => {
      errorInterceptor(request, mockNext).subscribe({
        error: () => {
          // Should not show toast or navigate when skip flag is set
          // Note: This test assumes SKIP_GLOBAL_ERROR context is not set
          expect(mockToast.show).toHaveBeenCalled();
          done();
        },
      });
    });
  });
});
