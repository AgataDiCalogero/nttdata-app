import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './posts-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  @Input({ required: true }) searchForm!: FormGroup;
  @Input() userOptions: { id: number; name?: string }[] = [];

  @Output() createPost = new EventEmitter<void>();
  @Output() resetFilters = new EventEmitter<void>();

  onCreate(): void {
    this.createPost.emit();
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
