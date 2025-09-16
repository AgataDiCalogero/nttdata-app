import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'users',
    loadComponent: () => import('./features/users/users').then((m) => m.Users),
  },
  {
    path: 'posts',
    loadComponent: () => import('./features/posts/posts').then((m) => m.Posts),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
