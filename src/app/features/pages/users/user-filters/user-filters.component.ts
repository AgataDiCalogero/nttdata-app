import {
  ChangeDetectionStrategy,
  Component,
  output,
  input,
  inject,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { IdService } from '@app/shared/services/id/id.service';
import { FormControl } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  imports: [
    CommonModule,
    ButtonComponent,
    LucideAngularModule,
    SearchBarComponent,
    SelectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFiltersComponent {
  readonly Plus = Plus;
  readonly showCreate = input(true);
  readonly perPageOptions = input<number[]>([]);
  readonly perPage = input<number>(10);
  readonly searchChange = output<string>();
  readonly perPageChange = output<number>();
  readonly create = output<void>();

  private readonly idService = inject(IdService);
  protected readonly searchId = this.idService.next('users-search');
  protected readonly perPageSelectId = this.idService.next('users-perpage');
  protected readonly perPageControl = new FormControl<string>('');

  protected readonly perPageSelectOptions = computed(() =>
    (this.perPageOptions() ?? []).map((value) => ({
      value: String(value),
      label: `${value} / page`,
    })),
  );

  constructor() {
    effect(() => {
      const current = String(this.perPage());
      if (this.perPageControl.value !== current) {
        this.perPageControl.setValue(current, { emitEvent: false });
      }
    });
  }

  onDebounced(value: string): void {
    this.searchChange.emit(value ?? '');
  }

  onPerPageSelected(value: string): void {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      this.perPageChange.emit(parsed);
    }
  }

  onCreate(): void {
    this.create.emit();
  }
}
