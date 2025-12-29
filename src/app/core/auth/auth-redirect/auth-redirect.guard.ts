import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../auth-service/auth.service';

export const authRedirectGuard: CanMatchFn = () => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (auth.isLoggedIn) {
    return router.createUrlTree(['/users']);
  }

  return true;
};
