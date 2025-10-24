import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';
import { IdService } from '@app/shared/services/id/id.service';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input.required<FormGroup>();
  readonly userOptions = input<{ id: number; name?: string }[]>([]);
  // optional control & output for per-page selection
  readonly perPageControl = input<FormControl | null>(null);
  readonly perPageOptions = input<{ value: number; label: string }[]>([]);
  readonly perPageChange = output<number>();

  readonly userSelectOptions = computed(() => [
    { value: 0 as const, label: 'All authors' },
    ...this.userOptions().map((user) => ({
      value: user.id,
      label: user.name || 'Unnamed user',
    })),
  ]);
  readonly resetFilters = output<void>();

  readonly perPageSelectOptions = computed(() => this.perPageOptions() ?? []);

  // generated ids for a11y (per-instance)
  private readonly idService = inject(IdService);
  protected readonly searchId = this.idService.next('posts-search');
  protected readonly userSelectId = this.idService.next('posts-user-select');
  protected readonly perPageSelectId = this.idService.next('posts-perpage-select');

  onPerPageChange(value: number | string): void {
    // normalize to number and forward to parent
    const num = typeof value === 'string' ? +value : value;
    this.perPageChange.emit(num);
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
