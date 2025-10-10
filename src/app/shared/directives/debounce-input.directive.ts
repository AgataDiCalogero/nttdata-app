import { Directive, EventEmitter, Output, input, effect, signal } from '@angular/core';

@Directive({
  selector: '[appDebounceInput]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class DebounceInputDirective {
  readonly ms = input(300, { alias: 'appDebounceInput' });
  private readonly valueSig = signal<string>('');

  @Output() debounced = new EventEmitter<string>();

  constructor() {
    effect((onCleanup) => {
      const t = setTimeout(() => this.debounced.emit(this.valueSig()), this.ms());
      onCleanup(() => clearTimeout(t));
    });
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;
    this.valueSig.set(target.value);
  }
}
