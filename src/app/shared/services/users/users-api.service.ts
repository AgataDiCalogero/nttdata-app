import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import type {
  User,
  CreateUser,
  UpdateUser,
  ListResponse,
  PaginationMeta,
} from '@/app/shared/models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/users';

  list(params?: {
    page?: number;
    per_page?: number;
    name?: string;
    email?: string;
  }): Observable<ListResponse<User>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.name) httpParams = httpParams.set('name', params.name);
    if (params?.email) httpParams = httpParams.set('email', params.email);

    return this.http
      .get<User[]>(this.base, { params: httpParams, observe: 'response' })
      .pipe(map((resp) => this.mapResponse(resp)));
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

  private mapResponse(resp: HttpResponse<User[]>): ListResponse<User> {
    const data = resp.body ?? [];
    const totalHeader = Number(resp.headers.get('X-Pagination-Total')) || 0;
    const limitHeader = Number(resp.headers.get('X-Pagination-Limit')) || 0;
    const pagesHeader = Number(resp.headers.get('X-Pagination-Pages')) || 0;
    const pageHeader = Number(resp.headers.get('X-Pagination-Page')) || 1;

    const total = totalHeader || data.length;
    const limit = Math.max(1, limitHeader || data.length || 1);
    const computedPages =
      pagesHeader || (total && limit ? Math.ceil(Math.max(total, 1) / limit) : 1);

    const pagination: PaginationMeta = {
      total,
      pages: Math.max(1, computedPages),
      page: Math.max(1, pageHeader),
      limit,
    };

    return {
      items: data,
      pagination,
    };
  }
}
