import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Input,
  input,
  output,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  standalone: true,
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  imports: [CommonModule, MatIconModule, ButtonComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  private readonly pageSignal = signal(1);
  private readonly pageCountSignal = signal(1);

  readonly page = this.pageSignal;
  readonly pageCount = this.pageCountSignal;
  readonly ariaLabel = input<string>('');

  @Input('page')
  set pageInput(value: number) {
    this.pageSignal.set(Number.isFinite(value) ? Math.max(1, value) : 1);
  }

  @Input('pageCount')
  set pageCountInput(value: number) {
    this.pageCountSignal.set(Number.isFinite(value) ? Math.max(1, value) : 1);
  }

  readonly pageChange = output<number>();

  private readonly resolvedPage = computed(() => {
    const page = this.page();
    return Number.isFinite(page) ? Math.max(1, page) : 1;
  });
  private readonly resolvedPageCount = computed(() => {
    const pageCount = this.pageCount();
    return Number.isFinite(pageCount) ? Math.max(1, pageCount) : 1;
  });

  protected readonly canPrev = computed(() => this.resolvedPage() > 1);
  protected readonly canNext = computed(() => this.resolvedPage() < this.resolvedPageCount());

  prev(): void {
    if (!this.canPrev()) return;
    const nextPage = Math.max(1, this.resolvedPage() - 1);
    this.pageChange.emit(nextPage);
  }

  next(): void {
    if (!this.canNext()) return;
    const nextPage = Math.min(this.resolvedPageCount(), this.resolvedPage() + 1);
    this.pageChange.emit(nextPage);
  }
}
