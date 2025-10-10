import { Directive, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[appEscapeKey]',
  standalone: true,
  host: {
    '(keydown.escape)': 'onEscape()',
  },
})
export class EscapeKeyDirective {
  @Output() appEscapeKey = new EventEmitter<void>();

  onEscape(): void {
    this.appEscapeKey.emit();
  }
}
