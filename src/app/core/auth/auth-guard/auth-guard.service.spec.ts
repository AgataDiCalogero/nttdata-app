import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { of, throwError, firstValueFrom } from 'rxjs';

import { authGuard } from './auth-guard.service';
import { AuthService } from '../auth-service/auth.service';
import { TokenValidationService } from '../token-validation.service';

describe('authGuard', () => {
  let router: jasmine.SpyObj<Router>;
  let auth: { isLoggedIn: boolean; token: () => string | null };
  let validator: jasmine.SpyObj<TokenValidationService>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue({} as UrlTree);
    auth = { isLoggedIn: true, token: () => 'token-123' };
    validator = jasmine.createSpyObj('TokenValidationService', ['validate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: TokenValidationService, useValue: validator },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('redirect a /login quando il token è assente', async () => {
    auth.isLoggedIn = false;

    const result = TestBed.runInInjectionContext(() => authGuard(null as any, null as any));

    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('permette accesso quando validate ritorna success', async () => {
    validator.validate.and.returnValue(of({ success: true }));

    const result = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(null as any, null as any) as any),
    );

    expect(result).toBeTrue();
    expect(validator.validate).toHaveBeenCalledWith('token-123');
  });

  it('redirect a /login quando validate fallisce o lancia errore', async () => {
    validator.validate.and.returnValue(of({ success: false }));
    const failed = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(null as any, null as any) as any),
    );
    expect(failed).toBe(router.createUrlTree.calls.mostRecent().returnValue);

    validator.validate.and.returnValue(throwError(() => new Error('boom')));
    const errored = await TestBed.runInInjectionContext(() =>
      firstValueFrom(authGuard(null as any, null as any) as any),
    );
    expect(errored).toBe(router.createUrlTree.calls.mostRecent().returnValue);
  });
});
