import { Directive, output } from '@angular/core';

@Directive({
  selector: '[appEscapeKey]',
  standalone: true,
  host: {
    '(keydown.escape)': 'onEscape()',
  },
})
export class EscapeKeyDirective {
  readonly appEscapeKey = output<void>();

  onEscape(): void {
    this.appEscapeKey.emit();
  }
}
