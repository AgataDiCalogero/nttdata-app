import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from './auth-service/auth.service';

export const authRedirectGuard: CanMatchFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const target = auth.isLoggedIn ? '/users' : '/login';
  return router.createUrlTree([target]);
};
