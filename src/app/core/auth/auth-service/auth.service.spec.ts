import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('AuthService', () => {
  let session: MemoryStorage;
  let local: MemoryStorage;
  let originalSessionDescriptor: PropertyDescriptor | undefined;
  let originalLocalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    session = new MemoryStorage();
    local = new MemoryStorage();
    originalSessionDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage') ?? undefined;
    originalLocalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage') ?? undefined;
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      get: () => session,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => local,
    });

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }, AuthService],
    });
  });

  afterEach(() => {
    if (originalSessionDescriptor) {
      Object.defineProperty(globalThis, 'sessionStorage', originalSessionDescriptor);
    }
    if (originalLocalDescriptor) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalDescriptor);
    }
  });

  it('salva il token normalizzato in sessionStorage con setToken', () => {
    const service = TestBed.inject(AuthService);

    service.setToken('  ABC123  ');

    expect(session.getItem('auth-token')).toBe('ABC123');
    expect(service.token()).toBe('ABC123');
  });

  it('clearToken rimuove token da session/local e resetta il signal', () => {
    const service = TestBed.inject(AuthService);
    session.setItem('auth-token', 'foo');
    local.setItem('auth-token', 'foo');
    service.setToken('foo');

    service.clearToken();

    expect(session.getItem('auth-token')).toBeNull();
    expect(local.getItem('auth-token')).toBeNull();
    expect(service.token()).toBeNull();
  });

  it('non interagisce con lo storage quando non è ambiente browser', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, AuthService],
    });
    const service = TestBed.inject(AuthService);

    service.setToken('server-token');

    expect(session.getItem('auth-token')).toBeNull();
    expect(service.token()).toBe('server-token');
  });
});
