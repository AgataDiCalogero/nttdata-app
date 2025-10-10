import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type CardVariant =
  | 'default'
  | 'interactive'
  | 'subtle'
  | 'frosted'
  | 'danger'
  | 'outline'
  | 'ghost'
  | 'flat';
export type CardPadding = 'none' | 'compact' | 'default' | 'spacious';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"card card--" + variant() + " card--padding-" + padding()',
    '[class.card--interactive]': 'interactive()',
    '[class.card--skeleton]': 'skeleton()',
    '[class.skeleton]': 'skeleton()',
  },
})
export class CardComponent {
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('default');
  readonly interactive = input(false);
  readonly skeleton = input(false);
}
