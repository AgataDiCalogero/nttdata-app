import { Router, Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard/auth-guard.service';
import { inject } from '@angular/core';
import { AuthService } from './core/auth/auth-service/auth.service';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.Login),
    canActivate: [
      () => !inject(AuthService).isLoggedIn || inject(Router).createUrlTree(['/users']),
    ],
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pages/users/users.component').then((m) => m.Users),
    children: [
      {
        path: 'new',

        loadComponent: () =>
          import('./features/pages/users/user-form/user-form.component').then((m) => m.UserForm),
      },
      {
        path: ':id/edit',

        loadComponent: () =>
          import('./features/pages/users/user-form/user-form.component').then((m) => m.UserForm),
      },
      {
        path: ':id',

        loadComponent: () =>
          import('./features/pages/users/user-detail/user-detail.component').then(
            (m) => m.UserDetail,
          ),
      },
    ],
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pages/posts/posts.component').then((m) => m.Posts),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
