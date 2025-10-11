# Refactoring Checklist (remaining)

Mantieni i task piccoli e autonomi (1 PR per bullet).

1. Styles tidy
   - Snellire SCSS condivisi e componenti (es. `posts.component.scss`, `appearance-switcher`) rimuovendo duplicazioni e variabili non usate. Validare nessuna regressione visiva su Login, Posts, Users.

2. Build & test
   - Eseguire `npm run build` e risolvere eventuali warning/budget.
   - Eseguire `npm test` e stabilizzare la suite.

3. Minimal test coverage
   - Spec minime per `PostsStore` (happy path + edge reload) e `ToastService` (show/hide).
   - Valutare spec per `AuthGuard` e `PostsApiService`.

Note: prima di chiudere, esegui `npm run lint`, `npm run test:ci` e `npm run build:ci`.
