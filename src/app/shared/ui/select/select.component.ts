import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
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
  PLATFORM_ID,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { IdService } from '@app/shared/services/id/id.service';

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
  imports: [ReactiveFormsModule, CommonModule, MatSelectModule, MatFormFieldModule],
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
  private readonly platformId = inject(PLATFORM_ID);
  private readonly documentRef = inject(DOCUMENT, { optional: true });
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly _fallbackId = this.idService.next('select');

  protected readonly resolvedId = computed(() => (this.id() ? this.id() : this._fallbackId));

  @HostBinding('class.select--in-modal')
  get isInModal(): boolean {
    if (!this.isBrowser) return false;
    const doc = this.documentRef;
    if (!doc) return false;
    let element: HTMLElement | null = this.elementRef.nativeElement as HTMLElement | null;
    while (element && element !== doc.body) {
      if (element.classList.contains('cdk-overlay-pane')) {
        return true;
      }
      element = element.parentElement;
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

  onSelectionChange(value: SelectValue): void {
    this.selectionChange.emit(String(value));
  }
}
