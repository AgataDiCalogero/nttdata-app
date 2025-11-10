// src/app/shared/services/notifications/notifications.service.spec.ts
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { ToastService } from '@app/shared/ui/toast/toast.service';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let toastSpy: jasmine.SpyObj<ToastService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['show']);

    TestBed.configureTestingModule({
      providers: [NotificationsService, { provide: ToastService, useValue: toastSpy }],
    });

    service = TestBed.inject(NotificationsService);
  });

  it('should forward success messages to the toast service', () => {
    // Arrange
    const message = 'Profile saved';

    // Act
    service.showSuccess(message);

    // Assert
    expect(toastSpy.show).toHaveBeenCalledOnceWith('success', message);
  });

  it('should forward info messages to the toast service', () => {
    // Arrange
    const message = 'Background sync in progress';

    // Act
    service.showInfo(message);

    // Assert
    expect(toastSpy.show).toHaveBeenCalledOnceWith('info', message);
  });

  it('should forward error messages to the toast service', () => {
    // Arrange
    const message = 'Cannot delete post';

    // Act
    service.showError(message);

    // Assert
    expect(toastSpy.show).toHaveBeenCalledOnceWith('error', message);
  });

  it('should show mapped HTTP error messages and return them', () => {
    // Arrange
    const httpError = new HttpErrorResponse({ status: 403 });

    // Act
    const result = service.showHttpError(httpError, 'Fallback');

    // Assert
    expect(result).toBe('You do not have permission to perform this action.');
    expect(toastSpy.show).toHaveBeenCalledOnceWith(
      'error',
      'You do not have permission to perform this action.',
    );
  });
});
