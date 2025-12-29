import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import en from '../../../assets/i18n/en.json';
import it from '../../../assets/i18n/it.json';

export type Locale = 'en' | 'it';

type Translations = Record<string, unknown>;

const TRANSLATIONS: Record<Locale, Translations> = {
  en,
  it,
};

const LANGUAGE_STORAGE_KEY = 'app-language';
const AVAILABLE_LOCALES: readonly Locale[] = ['en', 'it'];

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly localeSignal = signal<Locale>(this.resolveInitialLocale());

  readonly locale = this.localeSignal.asReadonly();
  readonly availableLocales = AVAILABLE_LOCALES;

  constructor() {
    effect(() => {
      const value = this.localeSignal();
      if (isPlatformBrowser(this.platformId)) {
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
        } catch {
          // ignore storage failures
        }
        this.document.documentElement.lang = value;
      }
    });
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) {
      return '';
    }
    const locale = this.localeSignal();
    const dictionary = TRANSLATIONS[locale];
    const value = key.split('.').reduce<unknown>((acc, token) => {
      if (acc != null && typeof acc === 'object' && token in acc) {
        return (acc as Record<string, unknown>)[token];
      }
      return undefined;
    }, dictionary);

    if (typeof value !== 'string') {
      return key;
    }

    if (!params) {
      return value;
    }

    return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
      return acc.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramValue));
    }, value);
  }

  setLocale(locale: Locale): void {
    if (locale === this.localeSignal()) {
      return;
    }
    this.localeSignal.set(locale);
  }

  private resolveInitialLocale(): Locale {
    if (!isPlatformBrowser(this.platformId)) {
      return 'en';
    }
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Locale | null;
      if (stored && AVAILABLE_LOCALES.includes(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    const navigatorLang = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'en';
    return AVAILABLE_LOCALES.includes(navigatorLang as Locale) ? (navigatorLang as Locale) : 'en';
  }
}
