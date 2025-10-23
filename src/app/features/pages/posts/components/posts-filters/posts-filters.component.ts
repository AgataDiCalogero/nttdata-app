import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';
import { LucideAngularModule, Search } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    SelectComponent,
    LucideAngularModule,
  ],
  templateUrl: './posts-filters.component.html',
  styleUrls: ['./posts-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input.required<FormGroup>();
  readonly userOptions = input<{ id: number; name?: string }[]>([]);
  readonly Search = Search;
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

  onCreate(): void {
    this.createPost.emit();
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
