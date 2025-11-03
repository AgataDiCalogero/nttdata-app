import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, shareReplay, tap, type Observable } from 'rxjs';
import type { User, CreateUser, UpdateUser } from '@/app/shared/models/user';
import type { ListResponse } from '@/app/shared/models/list-response';
import type { PaginationMeta } from '@/app/shared/models/pagination';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/users';
  private readonly listCache = new Map<string, Observable<ListResponse<User>>>();

  list(params?: {
    page?: number;
    per_page?: number;
    name?: string;
    email?: string;
  }, options?: { cache?: boolean }): Observable<ListResponse<User>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.name) httpParams = httpParams.set('name', params.name);
    if (params?.email) httpParams = httpParams.set('email', params.email);

    const cacheKey = options?.cache ? this.getCacheKey(httpParams) : null;
    if (cacheKey) {
      const cached = this.listCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const request$ = this.http
      .get<User[]>(this.base, { params: httpParams, observe: 'response' })
      .pipe(
        map((resp) => this.mapResponse(resp)),
        tap({
          error: () => {
            if (cacheKey) {
              this.listCache.delete(cacheKey);
            }
          },
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

    if (cacheKey) {
      this.listCache.set(cacheKey, request$);
    }

    return request$;
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.base}/${id}`);
  }

  create(payload: CreateUser): Observable<User> {
    return this.http.post<User>(this.base, payload).pipe(
      tap(() => this.listCache.clear()),
    );
  }

  update(id: number, payload: UpdateUser): Observable<User> {
    return this.http.patch<User>(`${this.base}/${id}`, payload).pipe(
      tap(() => this.listCache.clear()),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(
      tap(() => this.listCache.clear()),
    );
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

  private getCacheKey(params: HttpParams): string {
    const entries = params
      .keys()
      .sort()
      .map((key) => `${key}=${params.getAll(key)?.join(',') ?? ''}`);
    return entries.join('&');
  }
}
