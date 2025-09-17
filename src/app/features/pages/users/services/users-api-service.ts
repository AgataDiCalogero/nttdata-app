import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/***
 * TODO: fare cartella model + file interfacce user in users
 */

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
  private baseUrl = environment.baseUrl; // GoRest API base URL

  // Fetch all users
  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  // Delete a user by ID

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/users/${id}`);
  }
}
