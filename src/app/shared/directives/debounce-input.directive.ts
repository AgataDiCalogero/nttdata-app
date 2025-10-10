import { Directive, EventEmitter, Output, input, effect, signal } from '@angular/core';

@Directive({
  selector: '[appDebounceInput]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class DebounceInputDirective {
  readonly ms = input<number | ''>(300, { alias: 'appDebounceInput' });
  private readonly valueSig = signal<string>('');

  @Output() debounced = new EventEmitter<string>();

  constructor() {
    effect((onCleanup) => {
      const v = this.ms();
      const delay = typeof v === 'number' ? v : 300;
      const t = setTimeout(() => this.debounced.emit(this.valueSig()), delay);
      onCleanup(() => clearTimeout(t));
    });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    this.valueSig.set(target.value);
  }
}
