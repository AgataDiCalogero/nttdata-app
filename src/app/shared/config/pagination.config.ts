import { InjectionToken, type Provider } from '@angular/core';

export interface PaginationConfig {
  readonly defaultPage: number;
  readonly defaultPerPage: number;
  readonly perPageOptions: readonly number[];
}

export const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  defaultPage: 1,
  defaultPerPage: 10,
  perPageOptions: [10, 20, 50],
};

export const PAGINATION_CONFIG = new InjectionToken<PaginationConfig>('PAGINATION_CONFIG');

export function providePaginationConfig(config: Partial<PaginationConfig> = {}): Provider {
  const perPageOptions = config.perPageOptions ?? DEFAULT_PAGINATION_CONFIG.perPageOptions;
  return {
    provide: PAGINATION_CONFIG,
    useValue: {
      defaultPage: config.defaultPage ?? DEFAULT_PAGINATION_CONFIG.defaultPage,
      defaultPerPage: config.defaultPerPage ?? DEFAULT_PAGINATION_CONFIG.defaultPerPage,
      perPageOptions,
    } satisfies PaginationConfig,
  };
}
