import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  // Prefer input() over decorator, aliasing to attribute name
  readonly enabled = input<boolean | ''>(true, { alias: 'appAutoFocus' });

  constructor() {
    const v = this.enabled();
    const isEnabled = v === '' ? true : Boolean(v);
    if (!isEnabled) return;

    // Use a microtask to ensure the element is attached and visible
    setTimeout(() => {
      try {
        this.el.nativeElement.focus?.();
      } catch {
        // ignore in non-browser or unavailable focus environments
      }
    }, 0);
  }
}
