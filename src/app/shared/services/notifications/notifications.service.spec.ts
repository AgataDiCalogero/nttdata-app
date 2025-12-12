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
    const message = 'Profile saved';
    service.showSuccess(message);
    expect(toastSpy.show).toHaveBeenCalledOnceWith('success', message);
  });

  it('should forward info messages to the toast service', () => {
    const message = 'Background sync in progress';
    service.showInfo(message);
    expect(toastSpy.show).toHaveBeenCalledOnceWith('info', message);
  });

  it('should forward error messages to the toast service', () => {
    const message = 'Cannot delete post';
    service.showError(message);
    expect(toastSpy.show).toHaveBeenCalledOnceWith('error', message);
  });

  it('should show mapped HTTP error messages and return them', () => {
    const httpError = new HttpErrorResponse({ status: 403 });
    const result = service.showHttpError(httpError, 'Fallback');
    expect(result).toBe('You do not have permission to perform this action.');
    expect(toastSpy.show).toHaveBeenCalledOnceWith(
      'error',
      'You do not have permission to perform this action.',
    );
  });
});
