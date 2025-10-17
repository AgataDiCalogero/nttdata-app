import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, SelectComponent],
  templateUrl: './posts-filters.component.html',
  styleUrls: ['./posts-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input(null as unknown as FormGroup);
  readonly userOptions = input([] as { id: number; name?: string }[]);

  readonly userSelectOptions = computed(() => [
    { value: 0 as const, label: 'All authors' },
    ...this.userOptions().map((user) => ({
      value: user.id,
      label: user.name || 'Unnamed user',
    })),
  ]);

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();

  onCreate(): void {
    this.createPost.emit();
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
