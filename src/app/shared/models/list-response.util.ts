import type { HttpResponse } from '@angular/common/http';

import type { ListResponse } from './list-response';
import type { PaginationMeta } from './pagination';

export const PAGINATION_TOTAL_HEADER = 'X-Pagination-Total';
export const PAGINATION_LIMIT_HEADER = 'X-Pagination-Limit';
export const PAGINATION_PAGES_HEADER = 'X-Pagination-Pages';
export const PAGINATION_PAGE_HEADER = 'X-Pagination-Page';

export function mapPaginatedResponse<TDto, T>(
  response: HttpResponse<TDto[]>,
  mapper: (dto: TDto) => T,
): ListResponse<T> {
  const items = (response.body ?? []).map((dto) => mapper(dto));

  const totalHeader = Number(response.headers.get(PAGINATION_TOTAL_HEADER));
  const limitHeader = Number(response.headers.get(PAGINATION_LIMIT_HEADER));
  const pagesHeader = Number(response.headers.get(PAGINATION_PAGES_HEADER));
  const pageHeader = Number(response.headers.get(PAGINATION_PAGE_HEADER));

  const total = Number.isFinite(totalHeader) && totalHeader >= 0 ? totalHeader : items.length;
  const limit =
    Number.isFinite(limitHeader) && limitHeader > 0 ? limitHeader : Math.max(items.length, 1);
  const pages =
    Number.isFinite(pagesHeader) && pagesHeader > 0
      ? pagesHeader
      : total && limit
        ? Math.ceil(Math.max(total, 1) / limit)
        : 1;
  const page = Number.isFinite(pageHeader) && pageHeader > 0 ? pageHeader : 1;

  const pagination: PaginationMeta = {
    total,
    pages: Math.max(1, pages),
    page: Math.max(1, page),
    limit,
  };

  return {
    items,
    pagination,
  };
}
