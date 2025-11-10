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

  private readonly mediaQuery: MediaQueryList | null = null;

  constructor() {
    if (
      isPlatformBrowser(this.platformId) &&
      globalThis.window != null &&
      globalThis.matchMedia != null
    ) {
      this.mediaQuery = globalThis.matchMedia('(prefers-color-scheme: light)');

      const update = (event?: MediaQueryList | MediaQueryListEvent) => {
        const matches = event ? event.matches : (this.mediaQuery?.matches ?? false);
        this.systemThemeSignal.set(matches ? 'light' : 'dark');
      };

      // run initial detection
      update(this.mediaQuery ?? undefined);

      const listener = (event: MediaQueryListEvent) => update(event);

      type MQLWithLegacy = MediaQueryList & {
        addListener?: (l: (e: MediaQueryListEvent) => void) => void;
        removeListener?: (l?: (e: MediaQueryListEvent) => void) => void;
        addEventListener?: (t: string, l: unknown) => void;
        removeEventListener?: (t: string, l?: unknown) => void;
      };

      const mq = this.mediaQuery as MQLWithLegacy | null;

      if (mq?.addEventListener) {
        mq.addEventListener('change', listener);
        this.destroyRef.onDestroy(() => mq.removeEventListener?.('change', listener));
      } else {
        // Safari fallback (legacy API).
        // Use a narrow typed function for the legacy handlers to avoid lint/TS false positives
        // legacy addListener/removeListener have different signatures than addEventListener
        type LegacyAddFn = (listener: (ev: MediaQueryListEvent) => void) => void;
        type LegacyRemoveFn = (listener?: (ev: MediaQueryListEvent) => void) => void;
        const legacy = mq as unknown as Record<string, unknown>;
        const addLegacy = legacy['addListener'] as LegacyAddFn | undefined;
        addLegacy?.call(mq as MediaQueryList, listener);
        this.destroyRef.onDestroy(() =>
          (legacy['removeListener'] as LegacyRemoveFn | undefined)?.call(
            mq as MediaQueryList,
            listener,
          ),
        );
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
    if (
      !isPlatformBrowser(this.platformId) ||
      globalThis.window == null ||
      globalThis.matchMedia == null
    ) {
      return 'dark';
    }

    return globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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
