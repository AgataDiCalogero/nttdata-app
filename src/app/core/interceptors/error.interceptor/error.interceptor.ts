import { isPlatformBrowser } from '@angular/common';
import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, timer, retry } from 'rxjs';

import { I18nService } from '@app/shared/i18n/i18n.service';
import { ToastService } from '@app/shared/ui/toast/toast.service';
import { mapHttpError, type UiError } from '@app/shared/utils/error-mapper';

import { SKIP_GLOBAL_ERROR } from './http-context-tokens';
import { AuthService } from '../../auth/auth-service/auth.service';

const MAX_RATE_LIMIT_RETRIES = 1;
const SKIP_GLOBAL_ERROR_HEADER = 'X-Skip-Global-Error';

function shouldSkipGlobalError(req: HttpRequest<unknown>): boolean {
  if (req.context.get(SKIP_GLOBAL_ERROR) === true) {
    return true;
  }

  const headerValue = req.headers.get(SKIP_GLOBAL_ERROR_HEADER);
  if (headerValue == null || headerValue.trim() === '') {
    return false;
  }

  const normalized = headerValue.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function isIdempotentMethod(method: string): boolean {
  const upper = method.toUpperCase();
  return upper === 'GET' || upper === 'HEAD';
}

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  const auth = inject(AuthService);
  const toast = inject(ToastService);
  const i18n = inject(I18nService);
  const skipGlobal = shouldSkipGlobalError(req);
  const shouldRetry = isBrowser && !skipGlobal && isIdempotentMethod(req.method);

  const stream = shouldRetry
    ? next(req).pipe(
        retry({
          count: MAX_RATE_LIMIT_RETRIES,
          delay: (error, retryCount) => {
            const mapped = mapHttpError(error);
            if (mapped.kind === 'rate-limit') {
              const delayMs = mapped.retryAfterMs ?? Math.min(2000 * retryCount, 5000);
              const seconds = Math.max(1, Math.ceil(delayMs / 1000));
              toast.show(
                'info',
                i18n.translate('common.errors.rateLimitRetrying', { seconds }),
                delayMs + 500,
              );
              return timer(delayMs);
            }

            throw error;
          },
        }),
      )
    : next(req);

  return stream.pipe(
    catchError((error: unknown) => {
      const mapped = mapHttpError(error);
      const httpError =
        error instanceof HttpErrorResponse ? error : new HttpErrorResponse({ error, status: 0 });

      (httpError as HttpErrorResponse & { uiError?: UiError }).uiError = mapped;

      if (skipGlobal || !isBrowser) {
        return throwError(() => httpError);
      }

      switch (mapped.kind) {
        case 'unauthorized':
          auth.logout();
          toast.show('warning', i18n.translate(mapped.messageKey), 4000);
          router.navigate(['/login']).catch(() => {});
          break;
        case 'forbidden':
          toast.show('error', i18n.translate(mapped.messageKey), 4000);
          break;
        case 'validation':
          break;
        case 'rate-limit':
          toast.show('info', i18n.translate(mapped.messageKey), 4000);
          break;
        case 'network':
          toast.show('error', i18n.translate(mapped.messageKey), 4000);
          break;
        default:
          toast.show('error', i18n.translate(mapped.messageKey), 4000);
      }

      return throwError(() => httpError);
    }),
  );
};
