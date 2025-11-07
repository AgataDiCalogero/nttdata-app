import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, type Observable } from 'rxjs';
import type {
  Post,
  Comment,
  CreatePost,
  CreateComment,
  UpdatePost,
  UpdateComment,
} from '@/app/shared/models/post';
import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { ListResponse } from '@/app/shared/models/list-response';
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
  mapPostsDto,
  mapUpdateCommentToDto,
  mapUpdatePostToDto,
} from '@/app/shared/models/dto/post.dto';

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
  ): Observable<ListResponse<Post>> {
    let httpParams = new HttpParams();
    const { page, perPage, userId, title } = params;
    if (page) httpParams = httpParams.set('page', String(page));
    if (perPage) httpParams = httpParams.set('per_page', String(perPage));
    if (userId) httpParams = httpParams.set('user_id', String(userId));
    if (title) httpParams = httpParams.set('title', title);
    return this.http
      .get<PostDto[]>(this.base, { params: httpParams, observe: 'response' })
      .pipe(map((resp) => this.mapResponse(resp)));
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

  private mapResponse(resp: HttpResponse<PostDto[]>): ListResponse<Post> {
    const data = mapPostsDto(resp.body);
    const totalHeader = Number(resp.headers.get('X-Pagination-Total')) || 0;
    const limitHeader = Number(resp.headers.get('X-Pagination-Limit')) || 0;
    const pagesHeader = Number(resp.headers.get('X-Pagination-Pages')) || 0;
    const pageHeader = Number(resp.headers.get('X-Pagination-Page')) || 1;

    const total = totalHeader || data.length;
    const limit = limitHeader || data.length || 1;
    const computedPages = pagesHeader || (total && limit ? Math.ceil(total / limit) : 1);

    const pagination: PaginationMeta = {
      total,
      pages: computedPages || 1,
      page: Math.max(1, pageHeader),
      limit,
    };

    return {
      items: data,
      pagination,
    };
  }
}
