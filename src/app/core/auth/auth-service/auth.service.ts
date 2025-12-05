import { isPlatformBrowser } from '@angular/common';
import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';

const STORAGE_KEY = 'auth-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenSignal = signal<string | null>(null);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const session = this.getSessionStorage();
    const local = this.getLocalStorage();

    let saved = session?.getItem(STORAGE_KEY) ?? null;
    if (!saved) {
      const legacy = local?.getItem(STORAGE_KEY) ?? null;
      if (legacy) {
        saved = legacy;
        session?.setItem(STORAGE_KEY, legacy);
        local?.removeItem(STORAGE_KEY);
      }
    }

    this.tokenSignal.set(saved);
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
    const normalized = token.trim();
    this.getSessionStorage()?.setItem(STORAGE_KEY, normalized);
    this.tokenSignal.set(normalized);
  }

  logout(): void {
    this.clearToken();
  }

  clearToken() {
    this.getSessionStorage()?.removeItem(STORAGE_KEY);
    this.getLocalStorage()?.removeItem(STORAGE_KEY);
    this.tokenSignal.set(null);
  }

  private getSessionStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return globalThis?.sessionStorage ?? null;
    } catch {
      return null;
    }
  }

  private getLocalStorage(): Storage | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    try {
      return globalThis?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
