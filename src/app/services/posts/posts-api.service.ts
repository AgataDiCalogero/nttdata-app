import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import type { Post, Comment, CreatePost, CreateComment, PaginationMeta } from '@app/models';
import { HttpResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PostsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/posts';

  list(params?: {
    page?: number;
    per_page?: number;
    user_id?: number;
    title?: string;
  }): Observable<{ data: Post[]; pagination: PaginationMeta }> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.user_id) httpParams = httpParams.set('user_id', String(params.user_id));
    if (params?.title) httpParams = httpParams.set('title', params.title);
    return this.http
      .get<Post[]>(this.base, { params: httpParams, observe: 'response' })
      .pipe(map((resp) => this.mapResponse(resp)));
  }

  getById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.base}/${id}`);
  }

  create(payload: CreatePost): Observable<Post> {
    return this.http.post<Post>(this.base, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${postId}/comments`);
  }

  createComment(postId: number, payload: CreateComment): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${postId}/comments`, payload);
  }

  private mapResponse(resp: HttpResponse<Post[]>): { data: Post[]; pagination: PaginationMeta } {
    const data = resp.body ?? [];
    const totalHeader = Number(resp.headers.get('X-Pagination-Total')) || 0;
    const limitHeader = Number(resp.headers.get('X-Pagination-Limit')) || 0;
    const pagesHeader = Number(resp.headers.get('X-Pagination-Pages')) || 0;
    const pageHeader = Number(resp.headers.get('X-Pagination-Page')) || 1;

    const total = totalHeader || data.length;
    const limit = limitHeader || data.length || 1;
    const computedPages = pagesHeader || (total && limit ? Math.ceil(total / limit) : 1);

    return {
      data,
      pagination: {
        total,
        pages: computedPages || 1,
        page: Math.max(1, pageHeader),
        limit,
      },
    };
  }
}
