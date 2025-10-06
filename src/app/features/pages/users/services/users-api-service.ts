import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { User, CreateUser, UpdateUser } from '@app/models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/users'; // apiPrefixInterceptor aggiunge baseUrl

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: CreateUser): Observable<User> {
    return this.http.post<User>(this.base, payload);
  }

  update(id: number, payload: UpdateUser): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
