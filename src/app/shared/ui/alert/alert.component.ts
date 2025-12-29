import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"alert alert--" + variant()',
    '[class.alert--dismissible]': 'dismissible()',
    '[attr.role]': 'role',
    '[attr.aria-live]': 'ariaLive',
    'aria-atomic': 'true',
  },
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  get role(): string {
    return this.variant() === 'error' ? 'alert' : 'status';
  }

  get ariaLive(): 'polite' | 'assertive' {
    return this.variant() === 'error' ? 'assertive' : 'polite';
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
