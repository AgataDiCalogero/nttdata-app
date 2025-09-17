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
  $users = this.api.list(); // Observable stream of users

  // Lucide delete icon
  readonly Trash2 = Trash2;
}
