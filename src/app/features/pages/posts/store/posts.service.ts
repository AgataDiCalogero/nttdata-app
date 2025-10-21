import { Signal } from '@angular/core';
import type { Post, Comment, User, PaginationMeta, PostFilters } from '@/app/shared/models';
import type { FormGroup } from '@angular/forms';
import type { Observable } from 'rxjs';

export interface PostsService {
  // Signals pubblici
  loading: Signal<boolean>;
  error: Signal<string | null>;
  posts: Signal<Post[]>;
  pagination: Signal<PaginationMeta | null>;
  commentsMap: Signal<Record<number, Comment[]>>;
  commentsLoading: Signal<Record<number, boolean>>;
  userOptions: Signal<User[]>;
  userLookup: Signal<Record<number, string>>;
  deletingId: Signal<number | null>;
  searchForm: Signal<FormGroup>;
  perPageOptions: Signal<number[]>;
  currentPage: Signal<number>;
  totalPages: Signal<number>;
  currentPerPage: Signal<number>;
  hasPagination: Signal<boolean>;
  postsCount: Signal<number>;

  // Signals methods
  initializePaging(page: number, perPage: number): void;
  setPage(page: number): void;
  refresh(): void;
  resetFilters(): void;
  deletePost(post: Post): void;
  deletePostRequest(post: Post): Observable<void>;
  toggleComments(postId: number): void;
  onPostUpdated(post: Post): void;
  onCommentCreated(postId: number, comment: Comment): void;
  onCommentUpdated(postId: number, comment: Comment): void;
  changePerPage(perPage: number): void;
  setFilters(filters: PostFilters): void;
}
