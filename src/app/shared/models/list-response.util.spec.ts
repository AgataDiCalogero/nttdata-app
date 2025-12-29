import { HttpHeaders, HttpResponse } from '@angular/common/http';

import { mapPaginatedResponse } from './list-response.util';

describe('mapPaginatedResponse', () => {
  it('uses pagination headers when present', () => {
    const headers = new HttpHeaders({
      'X-Pagination-Total': '100',
      'X-Pagination-Limit': '10',
      'X-Pagination-Pages': '5',
      'X-Pagination-Page': '3',
    });
    const response = new HttpResponse({ body: [{ id: 1 }], headers });
    const mapped = mapPaginatedResponse(response, (dto) => ({ ...dto }));

    expect(mapped.items.length).toBe(1);
    expect(mapped.pagination).toEqual({
      total: 100,
      limit: 10,
      pages: 5,
      page: 3,
    });
  });

  it('falls back to defaults when headers are missing or invalid', () => {
    const headers = new HttpHeaders({
      'X-Pagination-Total': 'invalid',
      'X-Pagination-Limit': '-5',
      'X-Pagination-Pages': '0',
      'X-Pagination-Page': '0',
    });
    const response = new HttpResponse({ body: [{ id: 1 }, { id: 2 }], headers });
    const mapped = mapPaginatedResponse(response, (dto) => ({ ...dto }));
    const pagination = mapped.pagination!;

    expect(pagination.total).toBe(2);
    expect(pagination.limit).toBe(2);
    expect(pagination.pages).toBe(1);
    expect(pagination.page).toBe(1);
  });
});
