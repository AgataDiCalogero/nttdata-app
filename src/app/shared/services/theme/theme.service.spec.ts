import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';

import { ThemeService } from './theme.service';

class StorageStub {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

class MockMediaQueryList implements MediaQueryList {
  matches = true;
  media = '(prefers-color-scheme: light)';
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null = null;

  private listener?: (event: MediaQueryListEvent) => void;

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (type !== 'change') {
      return;
    }
    this.listener =
      typeof listener === 'function' ? listener : (event) => listener.handleEvent(event);
  }

  removeEventListener(type: string): void {
    if (type === 'change') {
      this.listener = undefined;
    }
  }

  addListener(listener: (this: MediaQueryList, ev: MediaQueryListEvent) => void): void {
    this.listener = (event) => listener.call(this, event);
  }

  removeListener(): void {
    this.listener = undefined;
  }

  dispatchEvent(event: Event): boolean {
    this.listener?.(event as MediaQueryListEvent);
    return true;
  }

  trigger(event: MediaQueryListEvent): void {
    this.listener?.(event);
  }
}

describe('ThemeService', () => {
  let service: ThemeService;
  let mockDocument: Document;
  let body: HTMLBodyElement;
  let docElement: HTMLElement;
  let storage: StorageStub;
  let matchMediaSpy: jasmine.Spy<(query: string) => MediaQueryList>;
  let mediaQueryList: MockMediaQueryList;
  type MatchMediaFn = (query: string) => MediaQueryList;
  const originalMatchMedia = (globalThis as typeof globalThis & { matchMedia?: MatchMediaFn })
    .matchMedia;

  beforeEach(() => {
    storage = new StorageStub();
    spyOn(localStorage, 'getItem').and.callFake((key: string) => storage.getItem(key));
    spyOn(localStorage, 'setItem').and.callFake((key: string, value: string) => {
      storage.setItem(key, value);
    });
    spyOn(localStorage, 'removeItem').and.callFake((key: string) => storage.removeItem(key));
    spyOn(localStorage, 'clear').and.callFake(() => storage.clear());

    mockDocument = document.implementation.createHTMLDocument('theme-spec');
    body = mockDocument.body as HTMLBodyElement;
    docElement = mockDocument.documentElement;
    body.className = '';
    delete docElement.dataset.theme;

    mediaQueryList = new MockMediaQueryList();
    matchMediaSpy = jasmine.createSpy('matchMedia').and.returnValue(mediaQueryList);
    (globalThis as typeof globalThis & { matchMedia: typeof matchMediaSpy }).matchMedia =
      matchMediaSpy;

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: DOCUMENT, useValue: mockDocument },
      ],
    });
  });

  afterEach(() => {
    (globalThis as typeof globalThis & { matchMedia?: MatchMediaFn }).matchMedia =
      originalMatchMedia;
  });

  it('should toggle theme from system preference to dark and persist it', (done) => {
    service = TestBed.inject(ThemeService);
    service.setPreference('system');
    (localStorage.setItem as jasmine.Spy).calls.reset();

    service.toggleTheme();

    setTimeout(() => {
      expect(service.theme()).toBe('dark');
      expect(body.classList.contains('dark-theme')).toBeTrue();
      expect(localStorage.setItem).toHaveBeenCalledWith('preferred-theme', 'dark');
      done();
    }, 10);
  });

  it('should set preference to light and update DOM dataset', (done) => {
    service = TestBed.inject(ThemeService);
    service.setPreference('dark');
    service.setPreference('light');

    setTimeout(() => {
      expect(service.theme()).toBe('light');
      expect(body.classList.contains('light-theme')).toBeTrue();
      expect(docElement.dataset.theme).toBe('light');
      done();
    }, 10);
  });

  it('should toggle reading mode and store flag', (done) => {
    service = TestBed.inject(ThemeService);
    service.setReadingMode(false);
    (localStorage.setItem as jasmine.Spy).calls.reset();

    service.toggleReadingMode();

    setTimeout(() => {
      expect(service.isReadingMode()).toBeTrue();
      expect(body.classList.contains('reading-mode')).toBeTrue();
      expect(localStorage.setItem).toHaveBeenCalledWith('reading-mode', 'true');
      service.toggleReadingMode();
      setTimeout(() => {
        expect(service.isReadingMode()).toBeFalse();
        expect(body.classList.contains('reading-mode')).toBeFalse();
        expect(localStorage.setItem).toHaveBeenCalledWith('reading-mode', 'false');
        done();
      }, 10);
    }, 10);
  });

  it('should respond to system theme changes via matchMedia listener', () => {
    service = TestBed.inject(ThemeService);
    service.setPreference('system');

    mediaQueryList.trigger({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('dark');
    expect(matchMediaSpy).toHaveBeenCalled();
  });

  it('does not crash when localStorage.setItem throws (Safari private mode)', fakeAsync(() => {
    (localStorage.setItem as jasmine.Spy).and.callFake(() => {
      throw new Error('blocked');
    });

    expect(() => {
      service = TestBed.inject(ThemeService);
    }).not.toThrow();

    expect(() => {
      service.setPreference('light');
    }).not.toThrow();

    flush();
    expect(body.classList.contains('light-theme')).toBeTrue();
  }));
});
