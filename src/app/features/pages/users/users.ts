import { Component, inject } from '@angular/core';
import { UsersApiService } from './services/users-api-service';
import type { User } from '@app/models';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { DeleteDialog } from '../../../shared/dialog/delete-dialog/delete-dialog';
import { BehaviorSubject } from 'rxjs';

// Users management page component
@Component({
  selector: 'app-users',
  imports: [AsyncPipe, LucideAngularModule, DeleteDialog],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private api = inject(UsersApiService);

  // Internal subject holding current users and public observable for template
  private usersSubject = new BehaviorSubject<User[]>([]);
  $users = this.usersSubject.asObservable();

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

  // Load initial users once
  constructor() {
    this.api.list().subscribe({
      next: (list) => this.usersSubject.next(list),
      error: (err) => console.error('Failed to load users:', err),
    });
  }

  // Handle dialog result
  onDialogClose(confirm: boolean) {
    this.showDialog = false;
    if (confirm && this.selectedUser) {
      const idToDelete = this.selectedUser.id;
      this.api.delete(idToDelete).subscribe({
        next: () => {
          // Update local subject by removing the deleted user so UI updates immediately
          const current = this.usersSubject.getValue();
          this.usersSubject.next(current.filter((u) => u.id !== idToDelete));
        },
        error: (err) => console.error('Delete failed:', err),
      });
    }
    this.selectedUser = null;
  }
}
