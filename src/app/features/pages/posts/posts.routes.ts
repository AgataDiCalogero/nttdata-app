import { Routes } from '@angular/router';

import { authGuard } from '@/app/core/auth/auth-guard/auth-guard.service';

export const POSTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./posts.component').then((m) => m.Posts),
  },
];
