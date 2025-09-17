import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth-service/auth-service';

// Route guard protecting authenticated routes
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Redirect to login if no token
  if (!auth.token()) {
    return router.createUrlTree(['/login']);
  }

  return true;
};
