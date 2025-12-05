import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },

  { path: 'login', renderMode: RenderMode.Prerender },

  { path: 'users', renderMode: RenderMode.Server },
  { path: 'users/new', renderMode: RenderMode.Server },
  { path: 'users/:id/edit', renderMode: RenderMode.Server },

  { path: 'posts', renderMode: RenderMode.Server },

  { path: '**', renderMode: RenderMode.Server },
];
