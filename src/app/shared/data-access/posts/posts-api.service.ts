import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { SKIP_GLOBAL_ERROR } from '@/app/core/interceptors/error.interceptor/http-context-tokens';
import {
  type CommentDto,
  type CreateCommentDto,
  type CreatePostDto,
  type PostDto,
  type UpdateCommentDto,
  type UpdatePostDto,
  mapCommentDto,
  mapCommentsDto,
  mapCreateCommentToDto,
  mapCreatePostToDto,
  mapPostDto,
  mapUpdateCommentToDto,
  mapUpdatePostToDto,
} from '@/app/shared/models/dto/post.dto';
import type { ListResponse } from '@/app/shared/models/list-response';
import { mapPaginatedResponse } from '@/app/shared/models/list-response.util';
import type {
  Post,
  Comment,
  CreatePost,
  CreateComment,
  UpdatePost,
  UpdateComment,
} from '@/app/shared/models/post';

@Injectable({ providedIn: 'root' })
export class PostsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/posts';

  list(
    params: {
      page?: number;
      perPage?: number;
      userId?: number;
      title?: string;
    } = {},
    options?: { skipGlobalError?: boolean },
  ): Observable<ListResponse<Post>> {
    let httpParams = new HttpParams();
    const { page, perPage, userId, title } = params;
    if (page != null) httpParams = httpParams.set('page', String(page));
    if (perPage != null) httpParams = httpParams.set('per_page', String(perPage));
    if (userId != null) httpParams = httpParams.set('user_id', String(userId));
    if (title != null && title !== '') httpParams = httpParams.set('title', title);
    const context =
      options?.skipGlobalError === true
        ? new HttpContext().set(SKIP_GLOBAL_ERROR, true)
        : undefined;
    return this.http
      .get<PostDto[]>(this.base, { params: httpParams, observe: 'response', context })
      .pipe(map((resp) => mapPaginatedResponse(resp, mapPostDto)));
  }

  getById(id: number): Observable<Post> {
    return this.http.get<PostDto>(`${this.base}/${id}`).pipe(map(mapPostDto));
  }

  create(payload: CreatePost): Observable<Post> {
    const dto: CreatePostDto = mapCreatePostToDto(payload);
    return this.http.post<PostDto>(this.base, dto).pipe(map(mapPostDto));
  }

  update(id: number, payload: UpdatePost): Observable<Post> {
    const dto: UpdatePostDto = mapUpdatePostToDto(payload);
    return this.http.patch<PostDto>(`${this.base}/${id}`, dto).pipe(map(mapPostDto));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listComments(postId: number): Observable<Comment[]> {
    return this.http
      .get<CommentDto[]>(`${this.base}/${postId}/comments`)
      .pipe(map((res) => mapCommentsDto(res)));
  }

  countComments(postId: number): Observable<number> {
    const params = new HttpParams().set('per_page', '1');
    return this.http
      .get<CommentDto[]>(`${this.base}/${postId}/comments`, { params, observe: 'response' })
      .pipe(
        map((resp) => {
          const header = Number(resp.headers.get('X-Pagination-Total'));
          if (Number.isFinite(header) && header >= 0) {
            return header;
          }
          return resp.body?.length ?? 0;
        }),
      );
  }

  createComment(postId: number, payload: CreateComment): Observable<Comment> {
    const dto: CreateCommentDto = mapCreateCommentToDto(postId, payload);
    return this.http
      .post<CommentDto>(`${this.base}/${postId}/comments`, dto)
      .pipe(map(mapCommentDto));
  }

  updateComment(commentId: number, payload: UpdateComment): Observable<Comment> {
    const dto: UpdateCommentDto = mapUpdateCommentToDto(payload);
    return this.http.patch<CommentDto>(`/comments/${commentId}`, dto).pipe(map(mapCommentDto));
  }

  deleteComment(commentId: number): Observable<void> {
    return this.http.delete<void>(`/comments/${commentId}`);
  }
}
