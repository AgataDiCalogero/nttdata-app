import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './posts-filters.component.html',
  styleUrls: ['./posts-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input(null as unknown as FormGroup);
  readonly userOptions = input([] as { id: number; name?: string }[]);

  readonly createPost = output<void>();
  readonly resetFilters = output<void>();

  onCreate(): void {
    this.createPost.emit();
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
