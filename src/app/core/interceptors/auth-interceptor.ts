import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth-service/auth-service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// HTTP interceptor for automatic token attachment and 401 handling
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();

  // Skip if no token available
  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status === 401) {
        auth.clearToken();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
