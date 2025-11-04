import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type BadgeStatus = 'active' | 'inactive';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <span
      class="status-badge"
      [class.status-badge--active]="status() === 'active'"
      [class.status-badge--inactive]="status() === 'inactive'"
      [class.status-badge--clickable]="clickable()"
      [attr.role]="clickable() ? 'button' : 'status'"
      [attr.aria-label]="ariaLabel()"
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
      <span class="status-badge__label">{{ status() }}</span>
    </span>
  `,
  styleUrls: ['./status-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadgeComponent {
  readonly status = input.required<BadgeStatus>();
  readonly ariaLabel = input<string>('');
  readonly clickable = input<boolean>(false);

  readonly statusChange = output<BadgeStatus>();

  onClick(): void {
    if (this.clickable()) {
      const newStatus = this.status() === 'active' ? 'inactive' : 'active';
      this.statusChange.emit(newStatus);
    }
  }
}
