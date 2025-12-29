import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideAngularModule, Search } from 'lucide-angular';

import { DebounceInputDirective } from '@app/shared/directives/debounce-input.directive';
import { IdService } from '@app/shared/services/id/id.service';

type SearchSize = 'wide' | 'compact' | 'small' | 'full';
const SIZE_SET = new Set<SearchSize>(['wide', 'compact', 'small', 'full']);

type SearchControl = FormControl<string> | FormControl<string | null>;

@Component({
  standalone: true,
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DebounceInputDirective,
    LucideAngularModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly idService = inject(IdService);
  readonly Search = Search;

  readonly size = input<SearchSize>('wide');
  readonly placeholder = input<string>('Search');
  readonly ariaLabel = input<string>('');
  readonly label = input<string>('');
  readonly id = input<string>('');
  readonly debounceTime = input<number | ''>(300);

  readonly control = input<SearchControl | null>(null);

  readonly debounced = output<string>();

  protected readonly labelText = computed(
    () => this.label() || this.ariaLabel() || this.placeholder(),
  );

  private readonly _generatedId = this.idService.next('searchbar');
  protected readonly labelId = computed(() =>
    this.id() ? `${this.id()}-label` : `${this._generatedId}-label`,
  );

  protected readonly inputId = computed(() =>
    this.id() ? `${this.id()}-input` : `${this._generatedId}-input`,
  );

  protected readonly isWide = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'wide' : true,
  );
  protected readonly isCompact = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'compact' : false,
  );
  protected readonly isSmall = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'small' : false,
  );
  protected readonly isFull = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'full' : false,
  );

  onDebounced(value: string): void {
    this.debounced.emit(value);
  }
}
