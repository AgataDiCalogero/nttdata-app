import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  templateUrl: './delete-dialog.html',
  styleUrl: './delete-dialog.scss',
})
export class DeleteDialog {
  // Entity name to show in the dialog (e.g. user name)
  @Input() entityName: string = '';

  // Emit true when confirm, false when cancel
  @Output() confirmDelete = new EventEmitter<boolean>();

  // Confirm action
  onConfirm() {
    this.confirmDelete.emit(true);
  }

  // Cancel action
  onCancel() {
    this.confirmDelete.emit(false);
  }
}
