import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';

import { AuthService } from '../auth-service/auth.service';
import { TokenValidationService } from '../token-validation.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const validator = inject(TokenValidationService);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // If no token, redirect to login immediately
  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/login']);
  }

  // Validate the token asynchronously
  return validator.validate(auth.token()!).pipe(
    map((result) => {
      if (result.success) {
        return true;
      } else {
        return router.createUrlTree(['/login']);
      }
    }),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
