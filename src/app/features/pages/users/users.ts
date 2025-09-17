import { Component, inject } from '@angular/core';
import { UsersApiService, User } from './services/users-api-service';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { DeleteDialog } from '../../../shared/dialog/delete-dialog/delete-dialog';

// Users management page component
@Component({
  selector: 'app-users',
  imports: [AsyncPipe, LucideAngularModule, DeleteDialog],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private api = inject(UsersApiService);

  // Observable stream of users
  $users = this.api.list();

  // Lucide delete icon
  readonly Trash2 = Trash2;

  // State for selected user and dialog visibility
  selectedUser: User | null = null;
  showDialog = false;

  // Open dialog with selected user
  openDeleteDialog(user: User) {
    this.selectedUser = user;
    this.showDialog = true;
  }

  // Handle dialog result
  onDialogClose(confirm: boolean) {
    this.showDialog = false;
    if (confirm && this.selectedUser) {
      this.api.delete(this.selectedUser.id).subscribe({
        next: () => {
          this.$users = this.api.list();
        },
        error: (err) => console.error('Delete failed:', err),
      });
    }
    this.selectedUser = null;
  }
}
