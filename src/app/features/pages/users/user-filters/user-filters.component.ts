import { Component, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { LucideAngularModule, Plus } from 'lucide-angular';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';

@Component({
  standalone: true,
  selector: 'app-user-filters',
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  imports: [CommonModule, ButtonComponent, LucideAngularModule, SearchBarComponent],
})
export class UserFiltersComponent {
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
