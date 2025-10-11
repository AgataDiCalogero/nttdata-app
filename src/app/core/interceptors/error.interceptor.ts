import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timer, retry } from 'rxjs';
import { AuthService } from '../auth/auth-service/auth.service';
import { ToastService } from '@app/shared/ui/toast';
import { mapHttpError, type UiError } from '@app/shared/utils/error-mapper';

const MAX_RATE_LIMIT_RETRIES = 1;

/**
 * Centralised error interceptor: maps HTTP errors to UI errors, handles auth redirects,
 * rate limit retry with backoff, and surfaces consistent toasts.
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    // Retry only on rate-limit using RxJS retry config
    retry({
      count: MAX_RATE_LIMIT_RETRIES,
      delay: (error, retryCount) => {
        const mapped = mapHttpError(error);
        if (mapped.kind === 'rate-limit') {
          const delayMs = mapped.retryAfterMs ?? Math.min(2000 * retryCount, 5000);
          const seconds = Math.max(1, Math.ceil(delayMs / 1000));
          toast.show('info', `Too many requests. Retrying in ${seconds}s.`, delayMs + 500);
          return timer(delayMs);
        }
        // Stop retrying for non rate-limit errors
        throw error;
      },
    }),
    catchError((error: unknown) => {
      const mapped = mapHttpError(error);
      const httpError =
        error instanceof HttpErrorResponse ? error : new HttpErrorResponse({ error, status: 0 });

      (httpError as HttpErrorResponse & { uiError?: UiError }).uiError = mapped;

      switch (mapped.kind) {
        case 'unauthorized':
          auth.clearToken();
          toast.show('warning', mapped.message, 4000);
          router.navigate(['/login']).catch(() => {});
          break;
        case 'forbidden':
          toast.show('error', mapped.message, 4000);
          break;
        case 'validation':
          // Let feature components surface field-level details.
          break;
        case 'rate-limit':
          toast.show('info', mapped.message, 4000);
          break;
        case 'network':
          toast.show('error', mapped.message, 4000);
          break;
        default:
          toast.show('error', mapped.message, 4000);
      }

      return throwError(() => httpError);
    }),
  );
};
