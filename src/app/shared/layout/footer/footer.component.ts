import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { TranslatePipe } from '@app/shared/i18n/translate.pipe';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatDividerModule, MatIconModule, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
