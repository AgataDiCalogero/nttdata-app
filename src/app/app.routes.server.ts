import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Example routing modes: tune to your app's needs
  { path: '', renderMode: RenderMode.Prerender },
  // Auth/login should be server-rendered (no SSG)
  { path: 'login', renderMode: RenderMode.Server },
  { path: 'users', renderMode: RenderMode.Prerender },
  // Create user route - do not prerender parametric or dynamic forms
  { path: 'users/new', renderMode: RenderMode.Server },
  // Ensure parametric edit route is server-rendered (no SSG/prerender)
  { path: 'users/:id/edit', renderMode: RenderMode.Server },
  // Posts listing - prerender if acceptable
  { path: 'posts', renderMode: RenderMode.Prerender },
  // Optional catch-all server fallback
  { path: '**', renderMode: RenderMode.Server },
];
