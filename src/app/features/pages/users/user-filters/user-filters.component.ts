import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebounceInputDirective } from '@app/shared/directives/debounce-input.directive';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, Search, Plus } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  imports: [CommonModule, DebounceInputDirective, ButtonComponent, LucideAngularModule],
})
export class UserFiltersComponent {
  readonly Search = Search;
  readonly Plus = Plus;
  readonly showCreate = input(true);
  readonly searchChange = output<string>();
  readonly create = output<void>();

  onDebounced(value: string): void {
    this.searchChange.emit(value ?? '');
  }

  onCreate(): void {
    this.create.emit();
  }
}
