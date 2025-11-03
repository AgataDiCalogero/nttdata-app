import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpErrorResponse,
  HttpResponse,
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

    return this.http.post<unknown>('/users', {}, { headers, context, observe: 'response' }).pipe(
      map((res: HttpResponse<unknown>) => {
        // Considera qualsiasi 2xx come “token valido”
        if (res.status >= 200 && res.status < 300) {
          return { success: true } satisfies TokenValidationResult;
        }
        // Per sicurezza, gestisci altri 2xx allo stesso modo
        return { success: true } satisfies TokenValidationResult;
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 422) {
            // Token valido ma corpo richiesto mancante
            return of({ success: true } satisfies TokenValidationResult);
          }
          if (error.status === 401) {
            return of({
              success: false,
              code: 'unauthorized',
              message:
                'The provided token is invalid or expired. Generate a new token from the GoRest dashboard.',
            } satisfies TokenValidationResult);
          }
        }
        // Altri errori (rete, rate-limit, ecc.)
        const mapped = this.mapUiErrorToResult(mapHttpError(error));
        return of(mapped);
      }),
    );
  }

  private mapUiErrorToResult(uiError: UiError): TokenValidationResult {
    const defaultMessage = 'Unable to verify the token right now. Please try again.';
    const message =
      typeof (uiError as any).message === 'string' ? (uiError as any).message : defaultMessage;
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
        return { success: false, code: 'rate_limited', message };
      case 'forbidden':
        return { success: false, code: 'unauthorized', message };
      default:
        return { success: false, code: 'unknown', message };
    }
  }
}
