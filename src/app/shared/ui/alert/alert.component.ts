import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"alert alert--" + variant()',
    '[class.alert--dismissible]': 'dismissible()',
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
})
export class AlertComponent {
  readonly variant = input<AlertVariant>('info');
  readonly dismissible = input(false);
  readonly dismissed = output<void>();

  onDismiss(): void {
    this.dismissed.emit();
  }
}
