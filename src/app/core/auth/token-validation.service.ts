import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

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
    const params = new HttpParams().set('per_page', '1');

    return this.http
      .get('/users', { headers, params, observe: 'response' })
      .pipe(
        map(() => ({ success: true as const })),
        catchError((error: unknown) => of(this.mapError(error)))
      );
  }

  private mapError(error: unknown): TokenValidationResult {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        success: false,
        code: 'unknown',
        message: 'Unable to verify the token right now. Please try again.',
      };
    }

    if (error.status === 0) {
      return {
        success: false,
        code: 'network',
        message: 'Network unreachable. Check your connection and try again.',
      };
    }

    if (error.status === 401 || error.status === 403) {
      return {
        success: false,
        code: 'unauthorized',
        message:
          'The provided token is invalid or expired. Generate a new token from the GoRest dashboard.',
      };
    }

    if (error.status === 429) {
      return {
        success: false,
        code: 'rate_limited',
        message: 'Too many attempts. Wait a few seconds before trying again.',
      };
    }

    if (error.status >= 500) {
      return {
        success: false,
        code: 'server',
        message: 'GoRest is temporarily unavailable. Please retry in a moment.',
      };
    }

    return {
      success: false,
      code: 'unknown',
      message: 'Unable to verify the token right now. Please try again.',
    };
  }
}
