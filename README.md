# NTT DATA Angular App

Single-page Angular application that integrates with the public GoREST API to manage users, posts, and comments. The project showcases token-based authentication, protected routes, CRUD workflows, accessibility-first templates, theming, and i18n-ready UI built with Angular standalone components and signals.

## Requirements

- Node.js 20+
- npm 10+
- GoREST personal access token from <https://gorest.co.in/consumer/login>

## Setup & Development

```bash
npm install
npm start
```

1. Navigate to <http://localhost:4200>.
2. Paste your personal access token on the login screen (session-scoped storage keeps it active until the tab closes).
3. Use the top-right language/theme controls to switch locales (EN/IT) or light/dark/system modes.

### Key npm scripts

| Command | Purpose |
| --- | --- |
| `npm run start` | Serve the app locally with live reload |
| `npm run build` / `npm run build:ci` | Production build (differing configs) |
| `npm run test` / `npm run test:ci` | Karma + Jasmine unit tests (watch/headless) |
| `npm run lint` / `npm run lint:fix` | ESLint with strict rules (import order, template a11y, no stray `console.log`) |
| `npm run format` / `npm run format:check` | Prettier formatting (write/check) |
| `npm run e2e` / `npm run e2e:ci` | Playwright smoke tests (see below) |

> First-time e2e run: `npx playwright install --with-deps` to download the browsers (CI does this automatically).

### Testing strategy

- **Unit/component**: `npm run test:ci` produces headless Chrome runs with coverage (target ≥60%).
- **E2E smoke**: Playwright mimics GoREST responses to verify login, user CRUD (search/create/delete), and post/comment flows. Start the dev server automatically via `npm run e2e`.

## Architecture & Documentation

- **State management**: Feature-level signal stores (`UsersStoreAdapter`, `PostsStoreAdapter`) keep normalized entity maps, pagination, and optimistic updates predictable.
- **HTTP interceptors**: API prefixing, auth header injection, and toast-backed error handling (401 logout, 429 retry/backoff).
- **Caching**: Lightweight in-memory caches for users and per-post comments (with TTL-based eviction) to avoid GoREST 429s.
- **ADRs**: See `docs/adr/` for the accepted decisions on signals, interceptors, caching, and token governance.

## Theming, Accessibility & i18n

- **Theme switcher**: Accessible menu with Light/Dark/System presets, reading mode toggle, and persisted CSS tokens (`data-theme`) for consistent styling.
- **Language switcher**: EN/IT toggles in the navbar update translated strings via a minimal `I18nService` plus JSON dictionaries in `src/assets/i18n/`.
- **UX polish**: Debounced searches, skeleton loaders, empty/error states with retry CTAs, confirmation dialogs on destructive flows, and template-level a11y linting.

## CI & Git hygiene

GitHub Actions (`.github/workflows/ci.yml`) runs lint → unit tests → build → Playwright smoke tests on every push/PR. Conventional Commit linting is enforced via Husky + Commitlint.

## Project structure highlights

```
src/app/core          # auth, guards, interceptors, theming
src/app/features      # auth/login, users, posts (lazy-loaded standalone routes)
src/app/shared        # UI kit, dialogs, directives, services, i18n utilities
src/assets/i18n       # JSON dictionaries (en/it)
docs/adr              # Architecture Decision Records
```

## Configuration

API base URLs live in `src/environments/*.ts`. Interceptors automatically prefix relative paths with the configured base URL and attach the Bearer token when available.

> Need help obtaining a GoREST token? Use the “Lost your token?” dialog on the login screen for step-by-step guidance.
