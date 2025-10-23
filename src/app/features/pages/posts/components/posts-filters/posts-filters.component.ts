import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    SelectComponent,
    SearchBarComponent,
  ],
  templateUrl: './posts-filters.component.html',
  styleUrls: ['./posts-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input.required<FormGroup>();
  readonly userOptions = input<{ id: number; name?: string }[]>([]);
  readonly perPageOptions = input<number[]>([10]);
  readonly currentPerPage = input<number>(10);
  readonly changePerPage = output<number>();

  readonly userSelectOptions = computed(() => [
    { value: 0 as const, label: 'All authors' },
    ...this.userOptions().map((user) => ({
      value: user.id,
      label: user.name || 'Unnamed user',
    })),
  ]);

  readonly perPageSelectOptions = computed(() =>
    (this.perPageOptions() || []).map((n) => ({ value: n, label: String(n) })),
  );

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();

  // Local control for per-page selection, synced from currentPerPage input
  protected readonly perPageControl = new FormControl<number>(10, { nonNullable: true });

  constructor() {
    effect(() => {
      const value = this.currentPerPage();
      if (typeof value === 'number' && this.perPageControl.value !== value) {
        this.perPageControl.setValue(value, { emitEvent: false });
      }
    });
  }

  onCreate(): void {
    this.createPost.emit();
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
