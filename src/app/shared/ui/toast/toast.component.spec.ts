import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { I18nService } from '@app/shared/i18n/i18n.service';

import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent', () => {
  it('does not steal focus and localizes the close label', fakeAsync(() => {
    const focusSpy = spyOn(HTMLElement.prototype, 'focus');
    const i18n = jasmine.createSpyObj<I18nService>('I18nService', ['translate']);
    i18n.translate.and.callFake((key: string) => `t:${key}`);

    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: I18nService, useValue: i18n }],
    });

    const fixture = TestBed.createComponent(ToastComponent);
    const toastService = TestBed.inject(ToastService);

    fixture.detectChanges();
    toastService.show('info', 'Hello', 1000);
    fixture.detectChanges();
    tick(0);

    const closeButton = fixture.nativeElement.querySelector(
      '.toast__close',
    ) as HTMLButtonElement | null;
    expect(closeButton?.getAttribute('aria-label')).toBe('t:toast.dismissAria');
    expect(focusSpy).not.toHaveBeenCalled();
  }));
});
