import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LoaderSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"loader loader--" + size()',
    '[class.loader--with-text]': 'text()',
  },
})
export class LoaderComponent {
  readonly size = input<LoaderSize>('medium');
  readonly text = input<string>();
}
