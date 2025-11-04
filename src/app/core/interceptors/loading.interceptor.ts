import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { LoadingOverlayService } from '@app/shared/services/loading/loading-overlay.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const loader = inject(LoadingOverlayService);
  loader.show();
  return next(req).pipe(finalize(() => loader.hide()));
};
