import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  computed,
  effect,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';

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
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly appliedTheme = computed<ThemeName>(() =>
    this.preferenceSignal() === 'system'
      ? this.systemThemeSignal()
      : (this.preferenceSignal() as ThemeName),
  );

  readonly theme = this.appliedTheme;
  readonly preference = this.preferenceSignal.asReadonly();
  readonly isLightTheme = computed(() => this.theme() === 'light');
  readonly isSystemPreference = computed(() => this.preferenceSignal() === 'system');
  readonly readingMode = this.readingModeSignal.asReadonly();
  readonly isReadingMode = computed(() => this.readingModeSignal());

  private readonly mediaQuery: MediaQueryList | undefined = undefined;

  constructor() {
    if (this.isBrowser && typeof globalThis.matchMedia === 'function') {
      this.mediaQuery = globalThis.matchMedia('(prefers-color-scheme: light)');

      const update = (event?: MediaQueryList | MediaQueryListEvent) => {
        const matches = event ? event.matches : (this.mediaQuery?.matches ?? false);
        this.systemThemeSignal.set(matches ? 'light' : 'dark');
      };

      update(this.mediaQuery);

      const listener = (event: MediaQueryListEvent) => update(event);

      type MQLWithLegacy = MediaQueryList & {
        addListener?: (l: (e: MediaQueryListEvent) => void) => void;
        removeListener?: (l?: (e: MediaQueryListEvent) => void) => void;
        addEventListener?: (t: string, l: unknown) => void;
        removeEventListener?: (t: string, l?: unknown) => void;
      };

      const mq = this.mediaQuery as MQLWithLegacy | undefined;
      if (mq) {
        const hasModernListeners =
          typeof mq.addEventListener === 'function' && typeof mq.removeEventListener === 'function';

        if (hasModernListeners) {
          const addListener = mq.addEventListener.bind(mq);
          const removeListener = mq.removeEventListener.bind(mq);
          addListener('change', listener);
          this.destroyRef.onDestroy(() => removeListener('change', listener));
        } else {
          type LegacyAddFn = (listener: (ev: MediaQueryListEvent) => void) => void;
          type LegacyRemoveFn = (listener?: (ev: MediaQueryListEvent) => void) => void;
          const legacy = mq as unknown as Record<string, unknown>;
          const addLegacy = legacy['addListener'] as LegacyAddFn | undefined;
          const removeLegacy = legacy['removeListener'] as LegacyRemoveFn | undefined;
          if (typeof addLegacy === 'function') {
            addLegacy.call(mq as MediaQueryList, listener);
            this.destroyRef.onDestroy(() => {
              if (typeof removeLegacy === 'function') {
                removeLegacy.call(mq as MediaQueryList, listener);
              }
            });
          }
        }
      }
    }

    effect(() => {
      if (!this.isBrowser) {
        return;
      }

      const currentTheme = this.theme();
      const readingMode = this.readingModeSignal();

      const body = this.document.body;
      const docEl = this.document.documentElement;

      body.classList.toggle('light-theme', currentTheme === 'light');
      body.classList.toggle('dark-theme', currentTheme === 'dark');
      body.classList.toggle('reading-mode', readingMode);
      docEl.dataset.theme = currentTheme;
    });
  }

  toggleTheme(): void {
    const preference = this.preferenceSignal();
    if (preference === 'system') {
      const next = this.systemThemeSignal() === 'light' ? 'dark' : 'light';
      this.setPreference(next);
      return;
    }
    this.setPreference(preference === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: ThemeName): void {
    this.setPreference(theme);
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceSignal.set(preference);
    this.persistPreference(preference);
  }

  toggleReadingMode(): void {
    this.setReadingMode(!this.readingModeSignal());
  }

  setReadingMode(enabled: boolean): void {
    this.readingModeSignal.set(enabled);
    this.persistReadingMode(enabled);
  }

  toggleBodyClass(className: string, enabled: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    this.document.body.classList.toggle(className, enabled);
  }

  private detectSystemTheme(): ThemeName {
    if (!isPlatformBrowser(this.platformId) || typeof globalThis.matchMedia !== 'function') {
      return 'dark';
    }

    return globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  private resolveInitialPreference(): ThemePreference {
    if (!isPlatformBrowser(this.platformId)) {
      return 'system';
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
      return 'system';
    } catch {
      return 'system';
    }
  }

  private resolveInitialReadingMode(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    try {
      const stored = localStorage.getItem(READING_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  private persistPreference(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // ignore storage failures (e.g. Safari private mode)
    }
  }

  private persistReadingMode(enabled: boolean): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(READING_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // ignore storage failures (e.g. Safari private mode)
    }
  }
}
