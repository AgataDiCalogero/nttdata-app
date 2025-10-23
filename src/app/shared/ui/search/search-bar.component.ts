import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { DebounceInputDirective } from '@app/shared/directives/debounce-input.directive';
import { LucideAngularModule, Search } from 'lucide-angular';

type SearchSize = 'wide' | 'compact';
const SIZE_SET = new Set<SearchSize>(['wide', 'compact']);

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly Search = Search;

  readonly size = input<SearchSize>('wide');
  readonly placeholder = input<string>('Search');
  readonly ariaLabel = input<string>('');
  readonly label = input<string>('');
  readonly debounceTime = input<number | ''>(300);

  // Optional reactive forms control
  readonly control = input<FormControl | null>(null);

  // Debounced value output for consumers that rely on events
  readonly debounced = output<string>();

  protected readonly labelText = computed(
    () => this.label() || this.ariaLabel() || this.placeholder(),
  );
  protected readonly labelId = computed(
    () =>
      `searchbar-label-${Math.abs(
        this.placeholder()
          .split('')
          .reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0),
      )}`,
  );

  protected readonly isWide = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'wide' : true,
  );
  protected readonly isCompact = computed(() =>
    SIZE_SET.has(this.size()) ? this.size() === 'compact' : false,
  );

  onDebounced(value: string): void {
    this.debounced.emit(value ?? '');
  }
}
