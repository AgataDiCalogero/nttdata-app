import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

type ThemeName = 'light' | 'dark';

const STORAGE_KEY = 'preferred-theme';
const READING_STORAGE_KEY = 'reading-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly themeSignal = signal<ThemeName>(this.resolveInitialTheme());
  private readonly readingModeSignal = signal<boolean>(this.resolveInitialReadingMode());

  readonly theme = this.themeSignal.asReadonly();
  readonly isLightTheme = computed(() => this.themeSignal() === 'light');
  readonly readingMode = this.readingModeSignal.asReadonly();
  readonly isReadingMode = computed(() => this.readingModeSignal());

  constructor() {
    effect(() => {
      const currentTheme = this.themeSignal();
      const readingMode = this.readingModeSignal();

      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const body = this.document.body;

      body.classList.toggle('light-theme', currentTheme === 'light');
      body.classList.toggle('dark-theme', currentTheme === 'dark');
      body.classList.toggle('reading-mode', readingMode);

      localStorage.setItem(STORAGE_KEY, currentTheme);
      localStorage.setItem(READING_STORAGE_KEY, readingMode ? 'true' : 'false');
    });
  }

  toggleTheme(): void {
    this.setTheme(this.themeSignal() === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeName): void {
    this.themeSignal.set(theme);
  }

  toggleReadingMode(): void {
    this.setReadingMode(!this.readingModeSignal());
  }

  setReadingMode(enabled: boolean): void {
    this.readingModeSignal.set(enabled);
  }

  private resolveInitialTheme(): ThemeName {
    if (!isPlatformBrowser(this.platformId)) {
      return 'dark';
    }

    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    const prefersLight =
      typeof window !== 'undefined' && 'matchMedia' in window
        ? window.matchMedia('(prefers-color-scheme: light)').matches
        : false;

    return prefersLight ? 'light' : 'dark';
  }

  private resolveInitialReadingMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const stored = localStorage.getItem(READING_STORAGE_KEY);
    return stored === 'true';
  }
}
