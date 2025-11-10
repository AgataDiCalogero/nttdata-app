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
    // Arrange
    const handle = createHandle('post-form', true);

    // Act
    service.activate(handle);

    // Assert
    expect(service.isActive('post-form')).toBeTrue();
    expect(body.classList.contains('ui-overlay-blocked')).toBeTrue();
    expect(body.dataset.uiOverlayKey).toBe('post-form');
  });

  it('should close previous handle when a new one is activated', () => {
    // Arrange
    const first = createHandle('user-form');
    const second = createHandle('user-delete-confirm');

    // Act
    service.activate(first);
    service.activate(second);

    // Assert
    expect(first.close).toHaveBeenCalledTimes(1);
    expect(service.isActive('user-delete-confirm')).toBeTrue();
  });

  it('should release only when the matching key is active', () => {
    // Arrange
    const handle = createHandle('appearance-menu');
    service.activate(handle);

    // Act
    service.release('post-form'); // wrong key, should have no effect
    service.release('appearance-menu');

    // Assert
    expect(service.isActive('appearance-menu')).toBeFalse();
    expect(body.classList.contains('ui-overlay-blocked')).toBeFalse();
    expect(body.dataset.uiOverlayKey).toBeUndefined();
  });

  it('should close the active overlay on closeActive', () => {
    // Arrange
    const handle = createHandle('token-help-dialog', true);
    service.activate(handle);

    // Act
    service.closeActive();

    // Assert
    expect(handle.close).toHaveBeenCalledTimes(1);
    expect(body.classList.contains('ui-overlay-blocked')).toBeFalse();
  });
});
