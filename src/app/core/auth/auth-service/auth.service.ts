import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenSignal = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('auth-token');
      this.tokenSignal.set(saved);
    }
  }

  get token() {
    return this.tokenSignal.asReadonly();
  }

  isAuthenticated(): boolean {
    const current = this.tokenSignal();
    return typeof current === 'string' && current.trim().length > 0;
  }

  setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('auth-token', token);
    }
    this.tokenSignal.set(token);
    // intentionally no logging here to avoid accidental secret leakage
  }

  clearToken() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('auth-token');
    }
    this.tokenSignal.set(null);
  }
}
