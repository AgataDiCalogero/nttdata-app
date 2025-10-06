import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiPrefixInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBase = environment?.baseUrl ?? '';
  const url = req.url ?? '';

  // se è un URL assoluto (http://, https://, //) lascia passare
  const isAbsolute = /^(https?:)?\/\//i.test(url);
  if (!url || isAbsolute || url.startsWith(apiBase)) {
    return next(req);
  }

  const prefixed = apiBase.replace(/\/$/, '') + (url.startsWith('/') ? url : `/${url}`);
  const cloned = req.clone({ url: prefixed });
  return next(cloned);
};
