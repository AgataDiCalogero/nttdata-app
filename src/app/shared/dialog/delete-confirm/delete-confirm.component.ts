import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ButtonComponent } from '@app/shared/ui/button/button.component';

import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { DeleteConfirmData } from '../../models';

@Component({
  selector: 'app-delete-confirm',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './delete-confirm.component.html',
  styleUrls: ['./delete-confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmComponent {
  private readonly dialogRef = inject(DialogRef<boolean>);
  data = inject<DeleteConfirmData>(DIALOG_DATA);

  confirm(): void {
    this.dialogRef.close(true);
  }

  cancel(): void {
    this.dialogRef.close(false);
  }
}
