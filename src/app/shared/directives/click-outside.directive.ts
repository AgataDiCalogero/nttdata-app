import { Directive, ElementRef, EventEmitter, Output, inject } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) return;
    if (!this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit(event);
    }
  }
}
