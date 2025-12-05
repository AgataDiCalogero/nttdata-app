import { Routes } from '@angular/router';

import { authRedirectGuard } from './core/auth/auth-redirect.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [authRedirectGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.Login),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.Login),
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
