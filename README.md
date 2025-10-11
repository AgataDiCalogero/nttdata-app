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
- Posts feature re-organization: completed. Files are now organized into `container/`, `view/`, and `store/`. Thin re-export stubs are present at the posts root to preserve imports while the repo migrates to canonical imports.
- The project builds and the dev server runs locally (run `npm start`). A production build completed successfully after a small, temporary increase to the per-component style warning budget (see `angular.json`). Consider refactoring large component styles or splitting them into partials later.

## Notes for contributors

- Use relative URLs; API base is added by the API prefix interceptor.
- Keep user‑facing copy in English.
- Prefer small, focused standalone components and lazy routes.
- Run `npm run lint` and ensure the app builds before opening a PR.

Notes for maintainers working on the posts feature

- The new store is at `src/app/features/pages/posts/store/posts.store.ts`.
- Presentational code is in `src/app/features/pages/posts/view/` and orchestration lives in `.../container/`.
- Re-exports exist at the feature root (`src/app/features/pages/posts/*.ts`) to avoid widespread import churn. Plan to replace those with canonical imports in a single refactor PR.

Immediate next actions you can take locally

```bat
# run lint and autofix where possible
npm run lint -- --fix

# run a production build to verify
npm run build
```

Suggested follow-ups (low risk order)

- Run ESLint and fix remaining warnings (I can do this next and push fixes).
- Replace re-export stubs with direct imports across the repo in one PR (breaking but clean). Use the convenience `index.ts` during the transition.
- Optionally refactor large component SCSS (split posts/appearance-switcher styles into partials) to meet original budgets.

Local dev quick-check (Windows cmd.exe)

```bat
npm install
npm start
```

If you need a production build and to see budget warnings:

```bat
npm run build
```
