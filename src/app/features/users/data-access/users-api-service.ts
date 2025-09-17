import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  gender: string;
  status: string;
}

// Service for GoRest API user operations
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private http = inject(HttpClient);
  private baseUrl = 'https://gorest.co.in/public/v2'; // GoRest API base URL

  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }
}
