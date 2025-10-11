# Refactoring Checklist (TODO only)

Keep ogni bullet piccolo e autonomo (1 PR ciascuno).

1. A11y & UX

- [ ] Liste e controlli: verificare che ogni `ul/ol` abbia solo `li` diretti; etichette e ruoli corretti nei template (focus su posts/comments).

1. Performance & State

- [ ] Verifica OnPush e `host` metadata su app shell, login, footer, Users, Posts (consistency pass).
- [ ] Migrazione a signals dove rimangono BehaviorSubject locali non necessari.

1. Posts feature re‑org (in progress)

- [ ] Riorganizzare `src/app/features/pages/posts/` in sotto-cartelle:
  - `container/` (page orchestration)
  - `view/` (presentational `PostsViewComponent`)
  - `post-card/` (già presente)
  - `post-form/` (già presente)
  - `store/` (signal store) — `PostsStore` scaffolding added at `store/posts.store.ts`
  - `styles/` (SCSS dedicati)
  - Aggiornare import e paths, nessun cambio funzionale.

Notes & validation

- A thin re-export `src/app/features/pages/posts/index.ts` exists to keep imports stable while files move.
- After changes run:

  ```bat
  npm run build
  npm run lint
  ```

  Ensure the build completes and update imports in one follow-up PR to avoid breaking changes.

1. Styling & Design System

- [ ] Consolidare utilità SCSS: assicurare import coerenti dei partials in features; rimuovere duplicazioni.
- [ ] Sweep `color-mix()` + fallback RGBA dove mancano.
- [ ] Adottare `NgOptimizedImage` per immagini statiche con dimensioni intrinseche.

1. Testing (target ≥ 60%)

- [ ] Aggiungere spec minime per: AuthService, AuthGuard, PostsApiService, UsersApiService, errorInterceptor, ToastService, 1 container (Users o Posts).
- [ ] Impostare gate di copertura in CI (< 60% = fail).

Note: eseguire `npm run lint`, `npm run test:ci` (con coverage) e `npm run build:ci` prima di chiudere ogni attività.
