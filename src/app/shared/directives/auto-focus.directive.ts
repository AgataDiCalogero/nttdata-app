import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly enabled = input<boolean | ''>(true, { alias: 'appAutoFocus' });

  constructor() {
    const v = this.enabled();
    const isEnabled = v === '' ? true : Boolean(v);
    if (!isEnabled) {
      return;
    }

    setTimeout(() => {
      try {
        this.el.nativeElement.focus?.();
      } catch (err) {
        console.debug('auto-focus error', err);
      }
    }, 0);
  }
}
