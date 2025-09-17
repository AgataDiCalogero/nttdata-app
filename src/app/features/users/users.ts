import { Component, inject } from '@angular/core';
import { UsersApiService, User } from './data-access/users-api-service';
import { AsyncPipe, NgFor } from '@angular/common';
@Component({
  selector: 'app-users',
  imports: [AsyncPipe, NgFor],
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private api = inject(UsersApiService);
  $users = this.api.list(); // Stream users
}
