import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },

  { path: 'login', renderMode: RenderMode.Server },
  { path: 'users', renderMode: RenderMode.Prerender },

  { path: 'users/new', renderMode: RenderMode.Server },

  { path: 'users/:id/edit', renderMode: RenderMode.Server },

  { path: 'posts', renderMode: RenderMode.Prerender },

  { path: '**', renderMode: RenderMode.Server },
];
