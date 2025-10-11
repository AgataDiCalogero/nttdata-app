# Refactoring Checklist (TODO only)

Keep ogni bullet piccolo e autonomo (1 PR ciascuno).

1. A11y & UX

- [ ] Liste e controlli: verificare che ogni `ul/ol` abbia solo `li` diretti; etichette e ruoli corretti nei template (focus su posts/comments).

1. Performance & State

- [ ] Verifica OnPush e `host` metadata su app shell, login, footer, Users, Posts (consistency pass).
- [ ] Migrazione a signals dove rimangono BehaviorSubject locali non necessari.

1. Posts feature re‑org (completed)

- ✅ Files reorganized into `container/`, `view/`, and `store/`.
- ✅ `PostsStore` implemented at `src/app/features/pages/posts/store/posts.store.ts`.
- ✅ Thin re-export stubs left at the feature root to preserve existing imports while the repo migrates to canonical imports.

Next tasks (recommended, ordered)

- ESLint pass
  - Run `npm run lint -- --fix` and manually fix remaining lint warnings.

- Replace re-exports with canonical imports
  - Update import sites across the repo to use direct paths (e.g. `.../posts/container/posts.component`) and remove the re-export stubs in a single PR. This keeps history clean and avoids partially-broken imports.

- Styles tidy
  - If desired, split `posts.component.scss` and `appearance-switcher.component.scss` into partials and remove duplicated rules to meet stricter style budgets.

- Tests
  - Add minimal specs for `PostsStore` (happy path + failure), and a spec for the container to assert wiring with the store.

Validation checklist (before merge)

- [ ] `npm run lint` passes (or only non-blocking warnings remain)
- [ ] `npm run build` completes
- [ ] Tests added/updated for Posts (optional but encouraged)

1. Styling & Design System

- [ ] Consolidare utilità SCSS: assicurare import coerenti dei partials in features; rimuovere duplicazioni.
- [ ] Sweep `color-mix()` + fallback RGBA dove mancano.
- [ ] Adottare `NgOptimizedImage` per immagini statiche con dimensioni intrinseche.

1. Testing (target ≥ 60%)

- [ ] Aggiungere spec minime per: AuthService, AuthGuard, PostsApiService, UsersApiService, errorInterceptor, ToastService, 1 container (Users o Posts).
- [ ] Impostare gate di copertura in CI (< 60% = fail).

Note: eseguire `npm run lint`, `npm run test:ci` (con coverage) e `npm run build:ci` prima di chiudere ogni attività.
