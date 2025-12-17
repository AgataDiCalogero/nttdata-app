import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Directive, ElementRef, inject, input, PLATFORM_ID } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly enabled = input<boolean | ''>(true, { alias: 'appAutoFocus' });

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const v = this.enabled();
    const isEnabled = v === '' ? true : Boolean(v);
    if (!isEnabled) {
      return;
    }

    try {
      this.el.nativeElement.focus();
    } catch {
      // ignore focus failures
    }
  }
}
