import { Component, inject } from '@angular/core';
import { UsersApiService, User } from './data-access/users-api-service';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule, Trash2 } from 'lucide-angular';

// Users management page component
@Component({
  selector: 'app-users',
  imports: [AsyncPipe, LucideAngularModule],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private api = inject(UsersApiService);

  // Observable stream of users
  $users = this.api.list();

  // Lucide delete icon
  readonly Trash2 = Trash2;

  // Delete user with confirmation and refresh

  onDelete(user: User) {
    if (confirm(`Are you sure you want to delete $user.name?`)) {
      this.api.delete(user.id).subscribe({
        next: () => {
          this.$users = this.api.list(); // Refresh list after delete
        },
        error: (err) => {
          console.error('Delete failed:', err); // Log error
        },
      });
    }
  }
}
