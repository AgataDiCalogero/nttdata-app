# NTT DATA Angular App

Single-page Angular app on the GoREST API for users, posts and comments. It demonstrates token-based auth, protected routes, CRUD, accessibility and theming.

````markdown
# NTT DATA Angular App

A polished Angular single‑page application that integrates with the public GoREST API to manage users, posts, and comments. The project showcases modern Angular patterns: standalone components, Signals for state, SSR hydration, accessibility, and a themed UI.

## Features

- Secure login with personal API token (stored in localStorage)
- Protected routes for Users and Posts
- Users: list, view details, create, update, delete
- Posts: list with filters (title, author), pagination, inline comments load/create, delete
- Consistent design system (buttons, cards, toasts, loaders) and light/dark theme
- Accessibility‑minded templates and focus management

## Tech stack

- Angular 20 (standalone, OnPush, Signals)
- Router with lazy loaded features and guard‑protected routes
- Interceptors: API prefix, Auth (Bearer), Error mapping

# NTT DATA Angular App

A polished Angular single-page application that integrates with the public GoREST API to manage users, posts, and comments. The project showcases modern Angular patterns: standalone components, Signals for state, SSR hydration, accessibility, and a themed UI.

## Features

- Secure login with personal API token (stored in localStorage)
- Protected routes for Users and Posts
- Users: list, view details, create, update, delete
- Posts: list with filters (title, author), pagination, inline comments load/create, delete
- Consistent design system (buttons, cards, toasts, loaders) and light/dark theme
- Accessibility-minded templates and focus management

## Tech stack

- Angular 20+ (standalone, OnPush, Signals)
- Router with lazy loaded features and guard-protected routes
- Interceptors: API prefix, Auth (Bearer), Error mapping
- UI: Angular CDK Dialog, lucide-angular icons
- Tooling: ESLint + Prettier, Karma + Jasmine, Husky + lint-staged

## Getting started (Windows)

Prerequisites

- Node.js 20+
- npm 10+
- A GoREST access token from <https://gorest.co.in/consumer/login>

Install dependencies

```bat
npm install
```

Run locally (development server)

```bat
npm start
```

Open <http://localhost:4200> and paste your token on first access. The token is persisted in localStorage until logout.

Lightweight checks

```bat
npm run lint
npm test
```

Full test runs and production builds are intended to run in CI; local developers should avoid running heavy production builds on every change.

## Configuration

API base URL is defined in `src/environments/*.ts` (see `baseUrl`). Interceptors automatically prefix relative URLs and attach the Bearer token when available.

## Project structure

- `src/app/core` – guards, interceptors, theme service
- `src/app/services` – REST clients (`UsersApiService`, `PostsApiService`)
- `src/app/features` – feature areas (Auth, Users, Posts)
- `src/app/shared` – reusable UI (button, card, toast, loader), directives, dialogs
- `src/app/models` – shared TypeScript models

## Conventions

- Use `input()`/`output()` helpers, Signals for local state, and `ChangeDetectionStrategy.OnPush`.
- Prefer control flow `@if`/`@for` in templates and always provide `track` for lists.
- Prefer feature-level signal stores. When RxJS interoperability is required expose a minimal bridge (e.g. `asObservable()` / `toObservable()`), keeping the signal store as the source-of-truth.
- Inside `<ul>/<ol>/<select>`, ensure `@for` produces valid child elements (`<li>`/`<option>`) — wrapping `@for` output in `<template>` is acceptable.
- Host bindings/listeners go in the `host` block of decorators.

## Accessibility

- Toasts are announced through a polite live region
- Lists and controls have labels and valid structures
- Focus is preserved/restored in dialogs and drawers

## Scripts

- `npm start` – dev server
- `npm run build` – production build (intended for CI)
- `npm run lint` – linting
- `npm test` – unit tests (interactive)
- `npm run test:ci` – unit tests (headless)

## License

This project is provided for educational purposes. Replace or extend licensing as needed for your use case.
````
