import { Directive, output, input, effect, signal } from '@angular/core';

@Directive({
  selector: '[appDebounceInput]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class DebounceInputDirective {
  readonly ms = input(300 as number | '', { alias: 'appDebounceInput' });
  private readonly valueSig = signal<string>('');

  readonly debounced = output<string>();

  constructor() {
    effect((onCleanup) => {
      const v = this.ms();
      const delay = typeof v === 'number' ? v : 300;
      const value = this.valueSig();
      const t = setTimeout(() => this.debounced.emit(value), delay);
      onCleanup(() => clearTimeout(t));
    });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    this.valueSig.set(target.value);
  }
}
