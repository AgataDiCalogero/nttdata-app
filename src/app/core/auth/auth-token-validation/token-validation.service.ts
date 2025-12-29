import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { mapHttpError, type UiError } from '@app/shared/utils/error-mapper';

import { SKIP_GLOBAL_ERROR } from '../../interceptors/error.interceptor/http-context-tokens';

export type TokenValidationErrorCode =
  | 'empty'
  | 'unauthorized'
  | 'rate_limited'
  | 'network'
  | 'server'
  | 'unknown';

export interface TokenValidationResult {
  success: boolean;
  code?: TokenValidationErrorCode;
  message?: string;
  retryAfterMs?: number;
}

@Injectable({ providedIn: 'root' })
export class TokenValidationService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);

  validate(token: string): Observable<TokenValidationResult> {
    const normalized = token.trim();
    if (!normalized) {
      return of({
        success: false,
        code: 'empty',
        message: this.i18n.translate('login.errors.required'),
      } satisfies TokenValidationResult);
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${normalized}` });
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, true);
    const params = new HttpParams().set('page', '1').set('per_page', '1');

    return this.http.get<unknown>('/users', { headers, context, params }).pipe(
      map(() => ({ success: true }) satisfies TokenValidationResult),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          return of(this.mapHttpErrorToResult(error));
        }

        const mapped = this.mapUiErrorToResult(mapHttpError(error));
        return of(mapped);
      }),
    );
  }

  private mapUiErrorToResult(uiError: UiError): TokenValidationResult {
    const defaultMessage = this.i18n.translate('login.errors.unableToVerify');
    switch (uiError.kind) {
      case 'network':
        return {
          success: false,
          code: 'network',
          message: this.i18n.translate('login.errors.network'),
        };
      case 'unauthorized':
        return {
          success: false,
          code: 'unauthorized',
          message: this.i18n.translate('login.errors.invalidOrExpired'),
        };
      case 'rate-limit':
        return {
          success: false,
          code: 'rate_limited',
          message:
            uiError.retryAfterMs != null
              ? this.i18n.translate('login.errors.rateLimitedRetryIn', {
                  seconds: Math.max(1, Math.ceil(uiError.retryAfterMs / 1000)),
                })
              : this.i18n.translate('login.errors.rateLimited'),
          retryAfterMs: uiError.retryAfterMs,
        };
      case 'forbidden':
        return {
          success: false,
          code: 'unauthorized',
          message: this.i18n.translate('login.errors.invalidOrExpired'),
        };
      case 'validation':
        return {
          success: false,
          code: 'unauthorized',
          message: this.i18n.translate('login.errors.invalid'),
        };
      default:
        return { success: false, code: 'unknown', message: defaultMessage };
    }
  }

  private mapHttpErrorToResult(error: HttpErrorResponse): TokenValidationResult {
    if (error.status === 401) {
      return {
        success: false,
        code: 'unauthorized',
        message: this.i18n.translate('login.errors.invalidOrExpired'),
      };
    }

    if (error.status === 422 || error.status === 400) {
      return {
        success: false,
        code: 'unauthorized',
        message: this.i18n.translate('login.errors.invalid'),
      };
    }

    if (error.status === 429) {
      return this.mapUiErrorToResult(mapHttpError(error));
    }

    if (error.status === 0) {
      return {
        success: false,
        code: 'network',
        message: this.i18n.translate('login.errors.network'),
      };
    }

    return this.mapUiErrorToResult(mapHttpError(error));
  }
}
