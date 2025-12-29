import { ChangeDetectionStrategy, Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutoFocusDirective } from './auto-focus.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input type="text" [appAutoFocus]="enabled" />`,
  imports: [AutoFocusDirective],
})
class HostComponent {
  enabled = true;
}

describe('AutoFocusDirective', () => {
  describe('in browser', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
      });
    });

    it('does not focus when enabled=false', () => {
      const focusSpy = spyOn(HTMLInputElement.prototype, 'focus');

      fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.enabled = false;
      fixture.detectChanges();

      expect(focusSpy).not.toHaveBeenCalled();
    });
  });

  describe('on server', () => {
    let fixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      });
    });

    it('does not access DOM focus', () => {
      const focusSpy = spyOn(HTMLInputElement.prototype, 'focus');

      fixture = TestBed.createComponent(HostComponent);
      fixture.componentInstance.enabled = true;
      fixture.detectChanges();

      expect(focusSpy).not.toHaveBeenCalled();
    });
  });
});
