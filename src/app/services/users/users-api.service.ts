import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { User, CreateUser, UpdateUser } from '@app/models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/users'; // apiPrefixInterceptor adds the API base URL

  list(params?: {
    page?: number;
    per_page?: number;
    name?: string;
    email?: string;
  }): Observable<User[]> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.name) httpParams = httpParams.set('name', params.name);
    if (params?.email) httpParams = httpParams.set('email', params.email);

    return this.http.get<User[]>(this.base, { params: httpParams });
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
