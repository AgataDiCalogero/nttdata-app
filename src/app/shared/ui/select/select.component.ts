import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

export type SelectVariant = 'default' | 'compact';

@Component({
  standalone: true,
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  readonly control = input<any>(); // For FormControl binding
  readonly options = input<{ value: unknown; label: string }[]>([]);
  readonly placeholder = input<string>('');
  readonly variant = input<SelectVariant>('default');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly id = input<string>('');

  readonly selectionChange = output<unknown>();

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectionChange.emit(target.value);
  }
}
