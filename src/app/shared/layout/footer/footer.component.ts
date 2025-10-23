import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [MatDividerModule, MatIconModule, ButtonComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
