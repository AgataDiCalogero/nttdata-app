import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/auth-service/auth.service';

const ABSOLUTE_URL_RE = /^(https?:)?\/\//i;

function shouldAttachToken(url: string): boolean {
  const normalized = url.trim();
  if (!normalized) {
    return false;
  }

  if (!ABSOLUTE_URL_RE.test(normalized)) {
    return true;
  }

  const apiBase = environment.baseUrl.trim();
  if (!apiBase) {
    return false;
  }

  try {
    const baseOrigin = new URL(apiBase).origin;
    const requestOrigin = new URL(normalized, apiBase).origin;
    return requestOrigin === baseOrigin;
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const normalizedToken = token?.trim() ?? '';

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  if (!normalizedToken) {
    return next(req);
  }

  if (!shouldAttachToken(req.url)) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${normalizedToken}`,
    },
  });

  return next(authReq);
};
