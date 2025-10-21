import type { PaginationMeta } from './pagination';

export interface ListResponse<T> {
  items: T[];
  pagination?: PaginationMeta;
}
