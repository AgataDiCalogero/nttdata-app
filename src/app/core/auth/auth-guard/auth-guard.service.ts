import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth-service/auth.service';

// Route guard protecting authenticated routes.
// Allow SSR to pass (avoid flicker), enforce in browser.
export const authGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isBrowser) {
    return true;
  }

  return auth.token() ? true : router.createUrlTree(['/login']);
};
