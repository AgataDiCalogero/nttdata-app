import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
      role="status"
      [attr.aria-label]="ariaLabel()"
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
}
