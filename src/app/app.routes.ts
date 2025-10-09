import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth-guard/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pages/users/users').then((m) => m.Users),
    children: [
      {
        path: 'new',
        // load the user form as a standalone component so navigation to /users/new exists
        loadComponent: () =>
          import('./features/pages/users/user-form/user-form').then((m) => m.UserForm),
      },
      {
        path: ':id/edit',
        // load the user form for edit mode
        loadComponent: () =>
          import('./features/pages/users/user-form/user-form').then((m) => m.UserForm),
      },
      {
        path: ':id',
        // user detail page showing user info and their posts
        loadComponent: () =>
          import('./features/pages/users/user-detail/user-detail').then((m) => m.UserDetail),
      },
    ],
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    loadComponent: () => import('./features/pages/posts/posts').then((m) => m.Posts),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
