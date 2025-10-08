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
