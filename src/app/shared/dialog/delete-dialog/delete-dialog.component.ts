import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss'],
})
export class DeleteDialog {
  // Entity name to show in the dialog (e.g. user name)
  readonly entityName = input('' as string);

  readonly confirmDelete = output<boolean>();

  // Confirm action
  onConfirm() {
    this.confirmDelete.emit(true);
  }

  // Cancel action
  onCancel() {
    this.confirmDelete.emit(false);
  }
}
