import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Post, Comment, CreatePost, CreateComment } from '@app/models';

@Injectable({ providedIn: 'root' })
export class PostsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/posts';

  list(params?: {
    page?: number;
    per_page?: number;
    user_id?: number;
    title?: string;
  }): Observable<Post[]> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.per_page) httpParams = httpParams.set('per_page', String(params.per_page));
    if (params?.user_id) httpParams = httpParams.set('user_id', String(params.user_id));
    if (params?.title) httpParams = httpParams.set('title', params.title);
    return this.http.get<Post[]>(this.base, { params: httpParams });
  }

  getById(id: number): Observable<Post> {
    return this.http.get<Post>(`${this.base}/${id}`);
  }

  create(payload: CreatePost): Observable<Post> {
    return this.http.post<Post>(this.base, payload);
  }

  listComments(postId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.base}/${postId}/comments`);
  }

  createComment(postId: number, payload: CreateComment): Observable<Comment> {
    return this.http.post<Comment>(`${this.base}/${postId}/comments`, payload);
  }
}
