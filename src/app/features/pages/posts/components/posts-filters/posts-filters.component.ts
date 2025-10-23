import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input.required<FormGroup>();
  readonly userOptions = input<{ id: number; name?: string }[]>([]);

  readonly userSelectOptions = computed(() => [
    { value: 0 as const, label: 'All authors' },
    ...this.userOptions().map((user) => ({
      value: user.id,
      label: user.name || 'Unnamed user',
    })),
  ]);
  readonly resetFilters = output<void>();

  onReset(): void {
    this.resetFilters.emit();
  }
}
