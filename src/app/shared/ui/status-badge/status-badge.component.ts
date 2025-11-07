import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

export type BadgeStatus = 'active' | 'inactive';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  template: `
    <span
      class="status-badge"
      [class.status-badge--active]="status() === 'active'"
      [class.status-badge--inactive]="status() === 'inactive'"
      [class.status-badge--clickable]="clickable()"
      [attr.role]="clickable() ? 'button' : 'status'"
      [attr.aria-label]="ariaLabel() || (statusAriaLabel() | appTranslate)"
      [attr.tabindex]="clickable() ? 0 : null"
      (click)="onClick()"
      (keydown.enter)="onClick()"
      (keydown.space)="onClick()"
    >
      <mat-icon
        class="status-badge__icon"
        [svgIcon]="status() === 'active' ? 'lucide:check' : 'lucide:x'"
        aria-hidden="true"
      ></mat-icon>
      <span class="status-badge__label">{{ statusLabel() | appTranslate }}</span>
    </span>
  `,
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<BadgeStatus>();
  readonly ariaLabel = input<string>('');
  readonly clickable = input<boolean>(false);

  private readonly statusKey = computed(() => `common.status.${this.status()}`);
  private readonly statusAriaKey = computed(
    () => `common.status.aria.${this.status() === 'active' ? 'activeUser' : 'inactiveUser'}`,
  );

  protected statusLabel(): string {
    return this.statusKey();
  }

  protected statusAriaLabel(): string {
    return this.statusAriaKey();
  }

  readonly statusChange = output<BadgeStatus>();

  onClick(): void {
    if (this.clickable()) {
      const newStatus = this.status() === 'active' ? 'inactive' : 'active';
      this.statusChange.emit(newStatus);
    }
  }
}
