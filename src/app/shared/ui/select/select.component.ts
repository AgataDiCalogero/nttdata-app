import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type SelectVariant = 'default' | 'compact';

@Component({
  standalone: true,
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  imports: [ReactiveFormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  readonly control = input<FormControl | null>(null);
  readonly options = input<{ value: unknown; label: string }[]>([]);
  readonly placeholder = input<string>('');
  readonly showPlaceholder = input<boolean>(true);
  readonly variant = input<SelectVariant>('default');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly id = input<string>('');
  readonly label = input<string>('');

  readonly selectionChange = output<string>();

  constructor() {
    effect(() => {
      const ctrl = this.control();
      const dis = this.disabled();
      if (ctrl) {
        if (dis) {
          ctrl.disable();
        } else {
          ctrl.enable();
        }
      }
    });
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectionChange.emit(target.value);
  }
}
