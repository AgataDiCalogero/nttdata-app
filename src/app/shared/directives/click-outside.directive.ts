import { Directive, ElementRef, output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly appClickOutside = output<MouseEvent>();

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
