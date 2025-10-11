# Refactoring Checklist (TODO only)

Keep ogni bullet piccolo e autonomo (1 PR ciascuno).

1. Next tasks (recommended, ordered)

- Replace re-exports with canonical imports
  - Update import sites across the repo to use direct paths (e.g. `.../posts/container/posts.component`) and remove the re-export stubs in a single PR. This keeps history clean and avoids partially-broken imports.

- Styles tidy
  - If desired, split `posts.component.scss` and `appearance-switcher.component.scss` into partials and remove duplicated rules to meet stricter style budgets.

Validation checklist (before merge)

- [ ] `npm run build` completes

1. Other refactors

- Performance & State
  - [ ] Verifica OnPush e `host` metadata su app shell, login, footer, Users, Posts (consistency pass).

1. Testing (grouped)

- [ ] Aggiungere spec minime per: PostsStore (happy path + failure) e un spec per il container Posts.
- [ ] Aggiungere spec minime per: AuthService, AuthGuard, PostsApiService, UsersApiService, errorInterceptor, ToastService.
- [ ] Impostare gate di copertura in CI (< 60% = fail).

Note: eseguire `npm run lint`, `npm run test:ci` (con coverage) e `npm run build:ci` prima di chiudere ogni attività.
