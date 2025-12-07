import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  const storageKey = 'auth-token';

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
      ],
    });
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('reads token from sessionStorage on init', () => {
    sessionStorage.setItem(storageKey, 'token-123');

    const service = TestBed.inject(AuthService);

    expect(service.token()).toBe('token-123');
    expect(service.isLoggedIn).toBeTrue();
  });

  it('migrates legacy token from localStorage to sessionStorage', () => {
    localStorage.setItem(storageKey, 'legacy-token');

    const service = TestBed.inject(AuthService);

    expect(service.token()).toBe('legacy-token');
    expect(sessionStorage.getItem(storageKey)).toBe('legacy-token');
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('trims and stores token via setToken', () => {
    const service = TestBed.inject(AuthService);

    service.setToken('  NEW  ');

    expect(service.token()).toBe('NEW');
    expect(service.isLoggedIn).toBeTrue();
    expect(sessionStorage.getItem(storageKey)).toBe('NEW');
  });

  it('clearToken removes stored values and resets auth state', () => {
    const service = TestBed.inject(AuthService);
    service.setToken('active');

    service.clearToken();

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn).toBeFalse();
    expect(sessionStorage.getItem(storageKey)).toBeNull();
    expect(localStorage.getItem(storageKey)).toBeNull();
  });

  it('logout delegates to clearToken', () => {
    const service = TestBed.inject(AuthService);
    service.setToken('to-remove');

    service.logout();

    expect(service.token()).toBeNull();
    expect(service.isLoggedIn).toBeFalse();
  });
});
