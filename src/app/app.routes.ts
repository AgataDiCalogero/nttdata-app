import { Routes } from '@angular/router';

import { authRedirectGuard } from './core/auth/auth-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [authRedirectGuard],
    loadChildren: () => import('./features/auth/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'users',
    loadChildren: () => import('./features/pages/users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'posts',
    loadChildren: () => import('./features/pages/posts/posts.routes').then((m) => m.POSTS_ROUTES),
  },
  {
    path: '**',
    redirectTo: 'users',
  },
];
