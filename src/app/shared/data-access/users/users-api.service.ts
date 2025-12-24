import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, shareReplay, tap, type Observable } from 'rxjs';

import { SKIP_GLOBAL_ERROR } from '@/app/core/interceptors/error.interceptor/http-context-tokens';
import {
  type CreateUserDto,
  type UpdateUserDto,
  type UserDto,
  mapCreateUserToDto,
  mapUpdateUserToDto,
  mapUserDto,
} from '@/app/shared/models/dto/user.dto';
import type { ListResponse } from '@/app/shared/models/list-response';
import { mapPaginatedResponse } from '@/app/shared/models/list-response.util';
import type { User, CreateUser, UpdateUser } from '@/app/shared/models/user';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/users';
  private readonly listCache = new Map<string, Observable<ListResponse<User>>>();

  list(
    params: {
      page?: number;
      perPage?: number;
      name?: string;
      email?: string;
    } = {},
    options?: { cache?: boolean },
  ): Observable<ListResponse<User>> {
    let httpParams = new HttpParams();
    const { page, perPage, name, email } = params;
    if (page != null) httpParams = httpParams.set('page', String(page));
    if (perPage != null) httpParams = httpParams.set('per_page', String(perPage));
    if (name != null && name !== '') httpParams = httpParams.set('name', name);
    if (email != null && email !== '') httpParams = httpParams.set('email', email);

    const cacheKey = options?.cache === true ? this.getCacheKey(httpParams) : null;
    if (cacheKey != null) {
      const cached = this.listCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const request$ = this.http
      .get<UserDto[]>(this.base, { params: httpParams, observe: 'response' })
      .pipe(
        map((resp) => mapPaginatedResponse(resp, mapUserDto)),
        tap({
          error: () => {
            if (cacheKey != null) {
              this.listCache.delete(cacheKey);
            }
          },
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    if (cacheKey != null) {
      this.listCache.set(cacheKey, request$);
    }

    return request$;
  }

  getById(id: number, options?: { skipGlobalError?: boolean }): Observable<User> {
    const context =
      options?.skipGlobalError === true
        ? new HttpContext().set(SKIP_GLOBAL_ERROR, true)
        : undefined;
    return this.http.get<UserDto>(`${this.base}/${id}`, { context }).pipe(map(mapUserDto));
  }

  create(payload: CreateUser): Observable<User> {
    const dto: CreateUserDto = mapCreateUserToDto(payload);
    return this.http.post<UserDto>(this.base, dto).pipe(
      map(mapUserDto),
      tap(() => this.listCache.clear()),
    );
  }

  update(id: number, payload: UpdateUser): Observable<User> {
    const dto: UpdateUserDto = mapUpdateUserToDto(payload);
    return this.http.patch<UserDto>(`${this.base}/${id}`, dto).pipe(
      map(mapUserDto),
      tap(() => this.listCache.clear()),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(tap(() => this.listCache.clear()));
  }

  private getCacheKey(params: HttpParams): string {
    const entries = params
      .keys()
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${params.getAll(key)?.join(',') ?? ''}`);
    return entries.join('&');
  }
}
