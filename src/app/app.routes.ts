import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard/auth-guard.service';
import { authRedirectGuard } from './core/auth/auth-redirect/auth-redirect.guard';
import { Login } from './features/auth/login/login.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [authRedirectGuard],
    component: Login,
  },
  {
    path: 'login',
    canMatch: [authRedirectGuard],
    component: Login,
  },
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () => import('./features/pages/users/users.routes').then((m) => m.USERS_ROUTES),
  },
  {
    path: 'posts',
    canActivate: [authGuard],
    loadChildren: () => import('./features/pages/posts/posts.routes').then((m) => m.POSTS_ROUTES),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
