import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-user-list-skeleton',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './user-list-skeleton.component.html',
  styleUrls: ['./user-list-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListSkeletonComponent {
  readonly items = input(4);

  trackByIndex(index: number): number {
    return index;
  }

  get placeholders(): number[] {
    const count = Math.max(1, Number(this.items()) || 0);
    return Array.from({ length: count }, (_, idx) => idx);
  }
}
