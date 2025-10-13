import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebounceInputDirective } from '@app/shared/directives/debounce-input.directive';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  standalone: true,
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  imports: [CommonModule, DebounceInputDirective, ButtonComponent],
})
export class UserFiltersComponent {
  @Output() readonly searchChange = new EventEmitter<string>();
  @Output() readonly create = new EventEmitter<void>();

  onDebounced(value: string): void {
    this.searchChange.emit(value ?? '');
  }

  onCreate(): void {
    this.create.emit();
  }
}
