import { Routes } from '@angular/router';

import { authGuard } from '@/app/core/auth/auth-guard/auth-guard.service';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./users.component').then((m) => m.Users),
    children: [
      {
        path: 'new',
        loadComponent: () =>
          import('./user-components/user-form/user-form.component').then((m) => m.UserForm),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./user-components/user-form/user-form.component').then((m) => m.UserForm),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./user-components/user-detail/user-detail.component').then((m) => m.UserDetail),
      },
    ],
  },
];
