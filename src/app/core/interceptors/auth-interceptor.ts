import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth-service/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // If the request already provides an Authorization header (e.g. token validation),
  // do not override it with the stored token.
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  if (!token?.trim()) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token.trim()}`,
    },
  });

  return next(authReq);
};
