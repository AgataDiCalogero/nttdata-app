import { HttpClient, HttpContext, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
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
      });
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${normalized}`,
    });
    const context = new HttpContext().set(SKIP_GLOBAL_ERROR, true);

    return this.http.post('/users', {}, { headers, context }).pipe(
      map(() => ({ success: true as const })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 422) {
          return of({ success: true as const });
        }
        return of(this.mapUiErrorToResult(mapHttpError(error)));
      }),
    );
  }

  private mapUiErrorToResult(uiError: UiError): TokenValidationResult {
    const defaultMessage = 'Unable to verify the token right now. Please try again.';
    const maybeMsg = uiError as unknown as Record<string, unknown>;
    const message: string =
      typeof maybeMsg?.message === 'string' ? maybeMsg.message : defaultMessage;

    switch (uiError.kind) {
      case 'network':
        return {
          success: false,
          code: 'network',
          message,
        };
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
          message,
        };
      case 'forbidden':
        return {
          success: false,
          code: 'unauthorized',
          message,
        };
      default:
        return {
          success: false,
          code: 'unknown',
          message,
        };
    }
  }
}
