import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { I18nService } from '@/app/shared/i18n/i18n.service';
import type { DeleteConfirmData } from '@/app/shared/models/dialog';

import { DeleteConfirmComponent } from './delete-confirm.component';

class DialogRefStub {
  close = jasmine.createSpy('close');
}

describe('DeleteConfirmComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmComponent>;
  let component: DeleteConfirmComponent;
  let dialogRef: DialogRefStub;
  const i18nStub = { translate: (key: string) => key };
  const baseData = { title: 'Confirm', message: 'Please confirm' };

  const createComponent = (data: DeleteConfirmData) => {
    dialogRef = new DialogRefStub();

    TestBed.configureTestingModule({
      imports: [DeleteConfirmComponent],
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: data },
        { provide: I18nService, useValue: i18nStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('closes immediately when no action is supplied', fakeAsync(() => {
    createComponent({ ...baseData, confirmAction: undefined, confirmText: 'Delete' });
    component.confirm();
    tick();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  }));

  it('awaits observable actions before closing', fakeAsync(() => {
    const actionCalls: string[] = [];
    createComponent({
      ...baseData,
      confirmAction: () => {
        actionCalls.push('invoked');
        return of(void 0);
      },
    });

    component.confirm();
    tick();

    expect(actionCalls).toEqual(['invoked']);
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.submitting()).toBeFalse();
  }));

  it('propagates errors and exposes a translated message', fakeAsync(() => {
    const error = new Error('network');
    createComponent({
      ...baseData,
      confirmAction: () => throwError(() => error),
      errorMessage: 'Oops',
    });

    component.confirm();
    tick();

    expect(component.errorMessage()).toBe('network');
    expect(component.submitting()).toBeFalse();
    expect(dialogRef.close).not.toHaveBeenCalled();
  }));

  it('falls back to the provided fallback text when no message is available', fakeAsync(() => {
    createComponent({
      ...baseData,
      confirmAction: () => {
        throw new Error();
      },
      errorMessage: 'Custom',
    });

    component.confirm();
    tick();

    expect(component.errorMessage()).toBe('Custom');
  }));

  it('closes false when cancel is triggered', () => {
    createComponent({ ...baseData, confirmAction: undefined });
    component.cancel();
    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('changes the label while submitting', () => {
    createComponent({
      ...baseData,
      confirmAction: undefined,
      inProgressText: 'Deleting now',
    });
    expect(component.confirmLabel()).toBe('common.actions.delete');

    component['submitting'].set(true);
    expect(component.confirmLabel()).toBe('Deleting now');
  });
});
