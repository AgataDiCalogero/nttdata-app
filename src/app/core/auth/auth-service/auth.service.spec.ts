import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let sessionStorageSpy: jasmine.SpyObj<Storage>;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('Storage', ['getItem', 'setItem', 'removeItem']);
    localStorageSpy = jasmine.createSpyObj('Storage', ['getItem', 'setItem', 'removeItem']);

    spyOnProperty(globalThis, 'sessionStorage', 'get').and.returnValue(sessionStorageSpy);
    spyOnProperty(globalThis, 'localStorage', 'get').and.returnValue(localStorageSpy);

    TestBed.configureTestingModule({
      providers: [AuthService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and retrieve token', () => {
    const testToken = 'test-token-123';
    service.setToken(testToken);

    expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('auth-token', testToken);
    expect(service.token()).toBe(testToken);
    expect(service.isLoggedIn).toBe(true);
  });

  it('should trim token when setting', () => {
    const tokenWithSpaces = '  test-token-456  ';
    const trimmed = 'test-token-456';
    service.setToken(tokenWithSpaces);

    expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('auth-token', trimmed);
    expect(service.token()).toBe(trimmed);
  });

  it('should clear token on logout', () => {
    service.setToken('test-token');
    service.logout();

    expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('auth-token');
    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('auth-token');
    expect(service.token()).toBeNull();
    expect(service.isLoggedIn).toBe(false);
  });

  it('should migrate token from localStorage to sessionStorage', () => {
    const legacyToken = 'legacy-token';
    localStorageSpy.getItem.and.returnValue(legacyToken);
    sessionStorageSpy.getItem.and.returnValue(null);

    // Re-create service to trigger constructor logic
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    TestBed.inject(AuthService);

    expect(sessionStorageSpy.setItem).toHaveBeenCalledWith('auth-token', legacyToken);
    expect(localStorageSpy.removeItem).toHaveBeenCalledWith('auth-token');
  });

  it('should return false for isLoggedIn when token is empty', () => {
    service.setToken('');
    expect(service.isLoggedIn).toBe(false);

    service.setToken('   ');
    expect(service.isLoggedIn).toBe(false);
  });
});
