import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { UiOverlayService, OverlayKey } from './ui-overlay.service';

describe('UiOverlayService', () => {
  let service: UiOverlayService;
  let body: HTMLElement;

  beforeEach(() => {
    const documentMock = {
      body: document.createElement('body') as HTMLBodyElement,
    } as unknown as Document;

    TestBed.configureTestingModule({
      providers: [UiOverlayService, { provide: DOCUMENT, useValue: documentMock }],
    });

    service = TestBed.inject(UiOverlayService);
    body = documentMock.body;
  });

  function createHandle(key: OverlayKey, blockGlobalControls = false) {
    return {
      key,
      blockGlobalControls,
      close: jasmine.createSpy('close'),
    };
  }

  it('should activate a handle and block body when required', () => {
    const handle = createHandle('post-form', true);

    service.activate(handle);
    expect(service.isActive('post-form')).toBeTrue();
    expect(body.classList.contains('ui-overlay-blocked')).toBeTrue();
    expect(body.dataset.uiOverlayKey).toBe('post-form');
  });

  it('should close previous handle when a new one is activated', () => {
    const first = createHandle('user-form');
    const second = createHandle('user-delete-confirm');

    service.activate(first);
    service.activate(second);

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(service.isActive('user-delete-confirm')).toBeTrue();
  });

  it('should release only when the matching key is active', () => {
    const handle = createHandle('appearance-menu');
    service.activate(handle);

    service.release('post-form');
    service.release('appearance-menu');

    expect(service.isActive('appearance-menu')).toBeFalse();
    expect(body.classList.contains('ui-overlay-blocked')).toBeFalse();
    expect(body.dataset.uiOverlayKey).toBeUndefined();
  });

  it('should close the active overlay on closeActive', () => {
    const handle = createHandle('token-help-dialog', true);
    service.activate(handle);

    service.closeActive();
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(body.classList.contains('ui-overlay-blocked')).toBeFalse();
  });
});
