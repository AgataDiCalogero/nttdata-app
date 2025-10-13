import { Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  // Prefer input() over decorator, aliasing to attribute name
  readonly enabled = input<boolean | ''>(true, { alias: 'appAutoFocus' });

  constructor() {
    // afterNextRender(() => {
    const v = this.enabled();
    const isEnabled = v === '' ? true : Boolean(v);
    if (!isEnabled) return;
    // Attempt focus with a small delay to ensure visibility
    setTimeout(() => {
      this.el.nativeElement.focus?.();
    }, 0);
    // });
  }


    afterNextRender(() => {
    const v = this.enabled();
    const isEnabled = v === '' ? true : Boolean(v);
    if (!isEnabled) return;
    // Attempt focus with a small delay to ensure visibility
    setTimeout(() => {
      this.el.nativeElement.focus?.();
    }, 0);
    });
}
