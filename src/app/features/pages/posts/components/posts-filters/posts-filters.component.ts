import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { IdService } from '@app/shared/services/id/id.service';
import { ButtonComponent } from '@app/shared/ui/button/button.component';
import { SearchBarComponent } from '@app/shared/ui/search/search-bar.component';
import { SelectComponent } from '@app/shared/ui/select/select.component';

import type { PostsFiltersFormGroup } from '../../services/posts-filters.service';

@Component({
  standalone: true,
  selector: 'app-posts-filters',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    ButtonComponent,
    SelectComponent,
    SearchBarComponent,
    TranslatePipe,
  ],
  templateUrl: './posts-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsFiltersComponent {
  readonly searchForm = input.required<PostsFiltersFormGroup>();
  readonly userOptions = input<{ id: number; name?: string }[]>([]);
  readonly perPageControl = input<FormControl<number> | null>(null);
  readonly perPageOptions = input<{ value: number; label: string }[]>([]);
  readonly perPageChange = output<number>();
  private readonly i18n = inject(I18nService);

  readonly userSelectOptions = computed(() => [
    { value: 0 as const, label: this.i18n.translate('postsFilters.authorAll') },
    ...this.userOptions().map((user) => ({
      value: user.id,
      label:
        user.name != null && user.name.trim() !== ''
          ? user.name
          : this.i18n.translate('users.unnamed'),
    })),
  ]);
  readonly resetFilters = output<void>();

  readonly perPageSelectOptions = computed(() => this.perPageOptions());

  private readonly idService = inject(IdService);
  protected readonly searchId = this.idService.next('posts-search');
  protected readonly userSelectId = this.idService.next('posts-user-select');
  protected readonly perPageSelectId = this.idService.next('posts-perpage-select');

  onPerPageChange(value: number | string): void {
    const num = typeof value === 'string' ? +value : value;
    this.perPageChange.emit(num);
  }

  onReset(): void {
    this.resetFilters.emit();
  }
}
