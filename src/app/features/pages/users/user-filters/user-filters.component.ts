import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  output,
  input,
  inject,
  computed,
  effect,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LucideAngularModule, Plus } from 'lucide-angular';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { IdService } from '@app/shared/services/id/id.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';

@Component({
  standalone: true,
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    ButtonComponent,
    LucideAngularModule,
    SearchBarComponent,
    SelectComponent,
    TranslatePipe,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFiltersComponent {
  readonly Plus = Plus;

  readonly showCreate = input(true);
  readonly perPageOptions = input<number[]>([]);
  readonly perPage = input<number>(10);
  readonly searchTerm = input('');

  readonly searchChange = output<string>();
  readonly perPageChange = output<number>();
  readonly create = output<void>();
  readonly resetFilters = output<void>();

  private readonly idService = inject(IdService);

  protected readonly searchId = this.idService.next('users-search');
  protected readonly perPageSelectId = this.idService.next('users-perpage');

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly perPageControl = new FormControl<string>('', { nonNullable: true });

  protected readonly perPageSelectOptions = computed(() =>
    this.perPageOptions().map((value) => ({
      value: String(value),
      label: `${value}/page`,
    })),
  );

  constructor() {
    effect(() => {
      const search = this.searchTerm();
      if (this.searchControl.value !== search) {
        this.searchControl.setValue(search, { emitEvent: false });
      }
    });

    effect(() => {
      const current = String(this.perPage());
      if (this.perPageControl.value !== current) {
        this.perPageControl.setValue(current, { emitEvent: false });
      }
    });
  }

  onDebounced(value: string): void {
    this.searchChange.emit(value);
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

  onReset(): void {
    this.resetFilters.emit();
  }
}
