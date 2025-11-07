import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ButtonComponent } from '@app/shared/ui/button/button.component';

@Component({
  selector: 'app-token-help-dialog',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './token-help-dialog.component.html',
  styleUrls: ['./token-help-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenHelpDialogComponent {
  private readonly dialogRef = inject(DialogRef<void>);

  protected readonly gorestUrl = 'https://gorest.co.in/';

  close(): void {
    this.dialogRef.close();
  }
}
