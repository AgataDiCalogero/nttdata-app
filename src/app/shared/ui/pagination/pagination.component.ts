import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  standalone: true,
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  imports: [CommonModule, ButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly ariaLabel = input<string>('Pagination');

  readonly pageChange = output<number>();

  protected readonly canPrev = computed(() => (this.page() ?? 1) > 1);
  protected readonly canNext = computed(() => (this.page() ?? 1) < (this.pageCount() ?? 1));

  prev(): void {
    if (!this.canPrev()) return;
    const nextPage = Math.max(1, (this.page() || 1) - 1);
    this.pageChange.emit(nextPage);
  }

  next(): void {
    if (!this.canNext()) return;
    const nextPage = Math.min(this.pageCount() || 1, (this.page() || 1) + 1);
    this.pageChange.emit(nextPage);
  }
}
