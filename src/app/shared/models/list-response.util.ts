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

  const parseHeader = (name: string): number | undefined => {
    const raw = response.headers.get(name);
    if (raw === null) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const totalHeader = parseHeader(PAGINATION_TOTAL_HEADER);
  const limitHeader = parseHeader(PAGINATION_LIMIT_HEADER);
  const pagesHeader = parseHeader(PAGINATION_PAGES_HEADER);
  const pageHeader = parseHeader(PAGINATION_PAGE_HEADER);

  const total =
    Number.isFinite(totalHeader) && (totalHeader as number) >= 0
      ? (totalHeader as number)
      : items.length;
  const limit =
    Number.isFinite(limitHeader) && (limitHeader as number) > 0
      ? (limitHeader as number)
      : Math.max(items.length, 1);
  const pages =
    Number.isFinite(pagesHeader) && (pagesHeader as number) > 0
      ? (pagesHeader as number)
      : Math.ceil(Math.max(total, 1) / limit);
  const page =
    Number.isFinite(pageHeader) && (pageHeader as number) > 0 ? (pageHeader as number) : 1;

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
