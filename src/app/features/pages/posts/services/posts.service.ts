import { Signal } from '@angular/core';
import type { Observable } from 'rxjs';

import type { PaginationMeta } from '@/app/shared/models/pagination';
import type { Post, Comment, PostFilters } from '@/app/shared/models/post';
import type { User } from '@/app/shared/models/user';

import type { PostsFiltersFormGroup } from './posts-filters.service';

export interface PostsService {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  posts: Signal<Post[]>;
  pagination: Signal<PaginationMeta | null>;
  commentsMap: Signal<Partial<Record<number, Comment[]>>>;
  commentsLoading: Signal<Partial<Record<number, boolean>>>;
  commentsCountMap: Signal<Partial<Record<number, number>>>;
  userOptions: Signal<User[]>;
  userLookup: Signal<Record<number, string>>;
  deletingId: Signal<number | null>;
  searchForm: Signal<PostsFiltersFormGroup>;
  perPageOptions: Signal<number[]>;
  currentPage: Signal<number>;
  totalPages: Signal<number>;
  currentPerPage: Signal<number>;
  hasPagination: Signal<boolean>;
  totalPosts: Signal<number>;

  initializePaging(page: number, perPage: number): void;
  setPage(page: number): void;
  refresh(): void;
  resetFilters(): void;
  deletePost(post: Post): void;
  deletePostRequest(post: Post): Observable<void>;
  onPostUpdated(post: Post): void;
  changePerPage(perPage: number): void;
  setFilters(filters: PostFilters): void;
}
