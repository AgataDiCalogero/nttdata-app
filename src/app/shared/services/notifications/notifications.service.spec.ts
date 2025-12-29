import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let i18nSpy: jasmine.SpyObj<I18nService>;

  beforeEach(() => {
    toastSpy = jasmine.createSpyObj('ToastService', ['show']);
    i18nSpy = jasmine.createSpyObj('I18nService', ['translate']);
    i18nSpy.translate.and.callFake((key: string) => {
      if (key === 'common.errors.forbidden') {
        return 'You do not have permission to perform this action.';
      }
      return key;
    });

    TestBed.configureTestingModule({
      providers: [
        NotificationsService,
        { provide: ToastService, useValue: toastSpy },
        { provide: I18nService, useValue: i18nSpy },
      ],
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
    expect(i18nSpy.translate).toHaveBeenCalledWith('common.errors.forbidden');
    expect(toastSpy.show).toHaveBeenCalledOnceWith(
      'error',
      'You do not have permission to perform this action.',
    );
  });
});
