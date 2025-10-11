# Refactoring Checklist (remaining)

Mantieni i task piccoli e autonomi (1 PR per bullet).

1. Minimal test coverage
   - Spec minime per `PostsStore` (happy path + edge reload) e `ToastService` (show/hide).
   - Valutare spec per `AuthGuard` e `PostsApiService`.

Note: prima di chiudere, esegui `npm run lint`, `npm run test:ci` e `npm run build:ci`.
