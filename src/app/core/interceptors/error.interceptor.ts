import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth-service/auth-service';

/**
 * Error interceptor: mappa errori, effettua redirect su 401 e rilancia un error object tipato.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    // Tipizziamo l'errore HTTP per avere autocompletion e rilevamento dei tipi
    catchError((error: HttpErrorResponse) => {
      const status = error?.status ?? 0;

      // Handle auth
      if (status === 401) {
        try {
          auth?.clearToken?.();
        } catch {
          /* ignore */
        }
        router.navigate(['/login']).catch(() => {});
      }

      // Rilanciamo l'errore originale tipizzato per permettere al consumer di gestirlo
      return throwError(() => error);
    }),
  );
};
