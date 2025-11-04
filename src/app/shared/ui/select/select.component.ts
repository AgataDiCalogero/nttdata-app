import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  inject,
  computed,
  HostBinding,
  ElementRef,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { IdService } from '@app/shared/services/id/id.service';
import { CommonModule } from '@angular/common';

export type SelectVariant = 'default' | 'compact';
type SelectValue = string | number;
type SelectControl =
  | FormControl<string>
  | FormControl<number>
  | FormControl<string | null>
  | FormControl<number | null>;
type SelectOption = { value: SelectValue; label: string };

@Component({
  standalone: true,
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  imports: [ReactiveFormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent {
  readonly control = input<SelectControl | null>(null);
  readonly options = input<ReadonlyArray<SelectOption>>([]);
  readonly placeholder = input<string>('');
  readonly showPlaceholder = input<boolean>(true);
  readonly variant = input<SelectVariant>('default');
  readonly disabled = input(false);
  readonly required = input(false);
  readonly id = input<string>('');
  readonly label = input<string>('');
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  readonly selectionChange = output<string>();

  private readonly idService = inject(IdService);
  private readonly elementRef = inject(ElementRef);
  // fallback id generated once per component instance
  protected readonly _fallbackId = this.idService.next('select');

  protected readonly resolvedId = computed(() => (this.id() ? this.id() : this._fallbackId));

  @HostBinding('class.select--in-modal')
  get isInModal(): boolean {
    let element = this.elementRef.nativeElement as HTMLElement;
    while (element && element !== document.body) {
      if (element.classList.contains('cdk-overlay-pane')) {
        return true;
      }
      element = element.parentElement!;
    }
    return false;
  }

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
