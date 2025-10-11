# NTT DATA Angular App

Single-page Angular app on the GoREST API for users, posts and comments. It demonstrates token-based auth, protected routes, CRUD, accessibility and theming.

## Tech stack

- Angular 20 with standalone components, lazy routing and zoneless change detection (`provideZonelessChangeDetection`).
- Host bindings/listeners declared in the `host` object of decorators (avoid `@HostBinding`/`@HostListener`).
- Angular CDK Dialog for modal/drawer UIs, `lucide-angular` for icons.
- Signals for local state; interceptors for API prefix, auth, and error mapping.
- Tooling: ESLint + Prettier, Husky + lint-staged, Karma + Jasmine.

## Quick start (Windows)

Prerequisites

- Node.js 20.x
- npm 10.x
- A GoREST access token from <https://gorest.co.in/consumer/login>

Install dependencies

```bat
npm install
```

Run the dev server

```bat
npm start
```

Open <http://localhost:4200> and paste your token on the first access (it’s kept in localStorage until logout).

Build for production

```bat
npm run build
```

Lint and tests

```bat
npm run lint
npm test
npm run test:ci
```

Troubleshooting

- 401/redirect to login: set or refresh your GoREST token.
- CORS or network errors: the API base URL comes from `src/environments/*.ts` (`baseUrl`).
- CSS bundle warnings: two component styles slightly exceed the budget; non‑blocking and tracked for cleanup.

## Scripts

- `npm start` – local dev server (SSR hydration enabled)
- `npm run build` – production build (output in `dist/nttdata-app`)
- `npm run lint` – ESLint
- `npm test` – Karma interactive
- `npm run test:ci` – headless tests for CI

## Architecture overview

- `src/app/core` – interceptors (API prefix, auth, error), guards, theme service
- `src/app/services` – API services (`UsersApiService`, `PostsApiService`)
- `src/app/features` – route features (Users, Posts, Auth)
- `src/app/shared` – UI atoms (button, card, toast, loader), directives, dialogs, utilities
- `src/app/models` – shared types

Conventions

- Components: `input()`/`output()`, signals, `ChangeDetectionStrategy.OnPush`.
- Templates: new control flow (`@if`, `@for`), explicit `track`, prefer native controls.
- Styles: SCSS partials in `src/styles/`, BEM‑like class names, provide fallbacks for modern CSS features.
- Accessibility: toasts use a polite live region; loaders expose status via `<output>`.

## Current status

- Auth flow, interceptors, theming, users and posts features are functional.
- Accessibility fixes landed for toast/loader; host metadata used instead of `@Host*` where applicable.
- Posts feature: initial re-organization started (container/view/store split). A signal-based `PostsStore` has been added and thin re-export wrappers exist to keep imports stable while the migration finishes.
- The project builds and the dev server runs locally (run `npm start`). Two small component style budget warnings were observed during recent production builds for `posts.component.scss` and `appearance-switcher.component.scss` — non-blocking and tracked for follow-up.

## Notes for contributors

- Use relative URLs; API base is added by the API prefix interceptor.
- Keep user‑facing copy in English.
- Prefer small, focused standalone components and lazy routes.
- Run `npm run lint` and ensure the app builds before opening a PR.

If you're picking up the posts re-organization:

- The new store lives at `src/app/features/pages/posts/store/posts.store.ts`.
- Presentational components will be moved into `src/app/features/pages/posts/view/` and container logic into `.../container/`.
- A convenience re-export exists at `src/app/features/pages/posts/index.ts` to keep imports working during the transition.

Local dev quick-check (Windows cmd.exe)

```bat
npm install
npm start
```

If you need a production build and to see budget warnings:

```bat
npm run build
```
