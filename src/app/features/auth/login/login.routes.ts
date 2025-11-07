import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '@/app/core/auth/auth-service/auth.service';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./login.component').then((m) => m.Login),
    canActivate: [
      () => !inject(AuthService).isLoggedIn || inject(Router).createUrlTree(['/users']),
    ],
  },
];
