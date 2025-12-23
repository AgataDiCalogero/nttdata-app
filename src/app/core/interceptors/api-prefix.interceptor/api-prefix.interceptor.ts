import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

import { environment } from '../../../../environments/environment';

export const apiPrefixInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const apiBase = environment.baseUrl.trim();
  if (!apiBase) return next(req);
  const url = req.url;

  const isAbsolute = /^(https?:)?\/\//.test(url);
  if (!url || isAbsolute || url.startsWith(apiBase)) {
    return next(req);
  }

  const prefixed = apiBase.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`);
  const cloned = req.clone({ url: prefixed });
  return next(cloned);
};
