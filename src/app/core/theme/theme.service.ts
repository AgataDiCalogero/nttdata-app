import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'preferred-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly themeSignal = signal<ThemeName>(this.resolveInitialTheme());

  readonly theme = this.themeSignal.asReadonly();
  readonly isLightTheme = computed(() => this.themeSignal() === 'light');

  constructor() {
    effect(() => {
      const currentTheme = this.themeSignal();

      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const body = this.document.body;

      body.classList.toggle('light-theme', currentTheme === 'light');
      body.classList.toggle('dark-theme', currentTheme === 'dark');

      localStorage.setItem(STORAGE_KEY, currentTheme);
    });
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeName): void {
    this.themeSignal.set(theme);
  }

  private resolveInitialTheme(): ThemeName {
    if (!isPlatformBrowser(this.platformId)) {
      return 'dark';
    }

    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const prefersLight = typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia('(prefers-color-scheme: light)').matches
      : false;

    return prefersLight ? 'light' : 'dark';
  }
}
