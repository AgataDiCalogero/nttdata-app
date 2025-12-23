import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';

import { authRedirectGuard } from './auth-redirect.guard';
import { AuthService } from '../auth-service/auth.service';

describe('authRedirectGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let auth: { isLoggedIn: boolean };

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({} as UrlTree);
    auth = { isLoggedIn: true };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('redirects logged-in users to /users', () => {
    const result = TestBed.runInInjectionContext(() =>
      authRedirectGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/users']);
  });

  it('allows navigation for logged-out users', () => {
    auth.isLoggedIn = false;

    const result = TestBed.runInInjectionContext(() =>
      authRedirectGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows navigation on the server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    const result = TestBed.runInInjectionContext(() =>
      authRedirectGuard({} as Route, [] as UrlSegment[]),
    );

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });
});
