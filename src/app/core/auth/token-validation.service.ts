import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import { mapHttpError, type UiError } from '@app/shared/utils/error-mapper';

import { SKIP_GLOBAL_ERROR } from '../interceptors/http-context-tokens';

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

  validate(token: string): Observable<TokenValidationResult> {
    const normalized = token.trim();
    if (!normalized) {
      return of({
        success: false,
        code: 'empty',
        message: 'Access token is required. Paste your personal token to continue.',
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
    const defaultMessage = 'Unable to verify the token right now. Please try again.';
    const message = typeof uiError.message === 'string' ? uiError.message : defaultMessage;
    switch (uiError.kind) {
      case 'network':
        return { success: false, code: 'network', message };
      case 'unauthorized':
        return {
          success: false,
          code: 'unauthorized',
          message:
            'The provided token is invalid or expired. Generate a new token from the GoRest dashboard.',
        };
      case 'rate-limit':
        return {
          success: false,
          code: 'rate_limited',
          message: uiError.retryAfterMs
            ? `${message} Try again in ${Math.max(1, Math.ceil(uiError.retryAfterMs / 1000))}s.`
            : message,
          retryAfterMs: uiError.retryAfterMs,
        };
      case 'forbidden':
        return { success: false, code: 'unauthorized', message };
      default:
        return { success: false, code: 'unknown', message };
    }
  }

  private mapHttpErrorToResult(error: HttpErrorResponse): TokenValidationResult {
    if (error.status === 401) {
      return {
        success: false,
        code: 'unauthorized',
        message:
          'The provided token is invalid or expired. Generate a new token from the GoRest dashboard.',
      };
    }

    if (error.status === 422 || error.status === 400) {
      return {
        success: false,
        code: 'unauthorized',
        message: 'The provided token could not be validated. Please paste a valid token.',
      };
    }

    if (error.status === 429) {
      return this.mapUiErrorToResult(mapHttpError(error));
    }

    if (error.status === 0) {
      return { success: false, code: 'network', message: 'Network error. Check your connection.' };
    }

    return this.mapUiErrorToResult(mapHttpError(error));
  }
}
