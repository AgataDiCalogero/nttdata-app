import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'auth-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenSignal = signal<string | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(STORAGE_KEY); // <-- usa costante
      this.tokenSignal.set(saved);
    }
  }

  get token() {
    return this.tokenSignal.asReadonly();
  }

  // + aggiungi, comodo per template/guard future
  get isLoggedIn(): boolean {
    const t = this.tokenSignal();
    return !!t && t.trim().length > 0;
  }

  setToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, token.trim()); // <-- trim qui
    }
    this.tokenSignal.set(token.trim());
  }

  clearToken() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.tokenSignal.set(null);
  }
}
