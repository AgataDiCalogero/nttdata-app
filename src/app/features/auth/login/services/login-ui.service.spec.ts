import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import { DialogOverlayCoordinator } from '@/app/shared/services/ui-overlay/dialog-overlay-coordinator.service';
import { ToastService } from '@/app/shared/ui/toast/toast.service';

import { LoginUiService } from './login-ui.service';

describe('LoginUiService', () => {
  let service: LoginUiService;
  let mockDialog: jasmine.SpyObj<Dialog>;
  let mockOverlayCoordinator: jasmine.SpyObj<DialogOverlayCoordinator>;
  let mockToast: jasmine.SpyObj<ToastService>;
  let mockI18n: jasmine.SpyObj<I18nService>;
  let mockDialogRef: jasmine.SpyObj<DialogRef>;
  let overlayRelease: jasmine.Spy;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('DialogRef', ['close'], { closed: of(undefined) });
    mockDialog = jasmine.createSpyObj('Dialog', ['open']);
    mockOverlayCoordinator = jasmine.createSpyObj('DialogOverlayCoordinator', ['coordinate']);
    overlayRelease = jasmine.createSpy('overlayRelease');
    mockOverlayCoordinator.coordinate.and.returnValue(overlayRelease);
    mockToast = jasmine.createSpyObj('ToastService', ['show']);
    mockI18n = jasmine.createSpyObj('I18nService', ['translate']);

    mockDialog.open.and.returnValue(mockDialogRef);

    TestBed.configureTestingModule({
      providers: [
        LoginUiService,
        { provide: Dialog, useValue: mockDialog },
        { provide: DialogOverlayCoordinator, useValue: mockOverlayCoordinator },
        { provide: ToastService, useValue: mockToast },
        { provide: I18nService, useValue: mockI18n },
      ],
    });

    service = TestBed.inject(LoginUiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open token help dialog with correct configuration', () => {
    service.openTokenHelp();

    expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
      autoFocus: false,
      panelClass: ['token-help-dialog', 'app-dialog-panel', 'app-dialog--sm'],
      backdropClass: 'app-dialog-overlay',
    });
    expect(mockOverlayCoordinator.coordinate).toHaveBeenCalledWith(
      'token-help-dialog',
      jasmine.objectContaining({ close: jasmine.any(Function) }),
    );
  });

  it('should release overlay when dialog closes', () => {
    service.openTokenHelp();

    expect(overlayRelease).toHaveBeenCalled();
  });

  it('should show error toast with correct parameters', () => {
    const message = 'Test error message';
    service.showError(message);

    expect(mockToast.show).toHaveBeenCalledWith('error', message, 5000);
  });

  it('should show error toast with custom duration', () => {
    const message = 'Test error';
    const duration = 3000;
    service.showError(message, duration);

    expect(mockToast.show).toHaveBeenCalledWith('error', message, duration);
  });

  it('should show success toast with correct parameters', () => {
    const message = 'Success message';
    service.showSuccess(message);

    expect(mockToast.show).toHaveBeenCalledWith('success', message, 3000);
  });

  it('should get translated error message', () => {
    const key = 'login.errors.required';
    const translated = 'Token is required';
    mockI18n.translate.and.returnValue(translated);

    const result = service.getErrorMessage(key);

    expect(mockI18n.translate).toHaveBeenCalledWith(key, undefined);
    expect(result).toBe(translated);
  });

  it('should get translated error message with params', () => {
    const key = 'login.errors.minLength';
    const params = { count: 8 };
    const translated = 'Minimum 8 characters required';
    mockI18n.translate.and.returnValue(translated);

    const result = service.getErrorMessage(key, params);

    expect(mockI18n.translate).toHaveBeenCalledWith(key, params);
    expect(result).toBe(translated);
  });
});
