import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

type ThemeName = 'light' | 'dark';
export type ThemePreference = ThemeName | 'system';

const STORAGE_KEY = 'preferred-theme';
const READING_STORAGE_KEY = 'reading-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly preferenceSignal = signal<ThemePreference>(this.resolveInitialPreference());
  private readonly systemThemeSignal = signal<ThemeName>(this.detectSystemTheme());
  private readonly readingModeSignal = signal<boolean>(this.resolveInitialReadingMode());

  private readonly appliedTheme = computed<ThemeName>(() =>
    this.preferenceSignal() === 'system' ? this.systemThemeSignal() : (this.preferenceSignal() as ThemeName),
  );

  readonly theme = this.appliedTheme.asReadonly();
  readonly preference = this.preferenceSignal.asReadonly();
  readonly isLightTheme = computed(() => this.theme() === 'light');
  readonly isSystemPreference = computed(() => this.preferenceSignal() === 'system');
  readonly readingMode = this.readingModeSignal.asReadonly();
  readonly isReadingMode = computed(() => this.readingModeSignal());

  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined' && 'matchMedia' in window) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      const update = (event?: MediaQueryList | MediaQueryListEvent) => {
        const matches = event ? event.matches : this.mediaQuery?.matches ?? false;
        this.systemThemeSignal.set(matches ? 'light' : 'dark');
      };
      update(this.mediaQuery);
      const listener = (event: MediaQueryListEvent) => update(event);
      if (this.mediaQuery.addEventListener) {
        this.mediaQuery.addEventListener('change', listener);
        this.destroyRef.onDestroy(() => this.mediaQuery?.removeEventListener('change', listener));
      } else if (this.mediaQuery.addListener) {
        // Safari fallback
        this.mediaQuery.addListener(listener);
        this.destroyRef.onDestroy(() => this.mediaQuery?.removeListener(listener));
      }
    }

    effect(() => {
      const currentTheme = this.theme();
      const preference = this.preferenceSignal();
      const readingMode = this.readingModeSignal();

      if (!isPlatformBrowser(this.platformId)) {
        return;
      }

      const body = this.document.body;
      const docEl = this.document.documentElement;

      body.classList.toggle('light-theme', currentTheme === 'light');
      body.classList.toggle('dark-theme', currentTheme === 'dark');
      body.classList.toggle('reading-mode', readingMode);
      docEl.dataset.theme = currentTheme;

      localStorage.setItem(STORAGE_KEY, preference);
      localStorage.setItem(READING_STORAGE_KEY, readingMode ? 'true' : 'false');
    });
  }

  toggleTheme(): void {
    const preference = this.preferenceSignal();
    if (preference === 'system') {
      const next = this.systemThemeSignal() === 'light' ? 'dark' : 'light';
      this.preferenceSignal.set(next);
      return;
    }
    this.preferenceSignal.set(preference === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeName): void {
    this.preferenceSignal.set(theme);
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
  }

  toggleReadingMode(): void {
    this.setReadingMode(!this.readingModeSignal());
  }

  setReadingMode(enabled: boolean): void {
    this.readingModeSignal.set(enabled);
  }

  private detectSystemTheme(): ThemeName {
    if (!isPlatformBrowser(this.platformId) || typeof window === 'undefined' || !('matchMedia' in window)) {
      return 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private resolveInitialPreference(): ThemePreference {
    if (!isPlatformBrowser(this.platformId)) {
      return 'system';
    }

    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'system';
  }

  private resolveInitialReadingMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    const stored = localStorage.getItem(READING_STORAGE_KEY);
    return stored === 'true';
  }
}
