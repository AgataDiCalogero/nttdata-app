# Refactoring Checklist (remaining)

Mantieni i task piccoli e autonomi (1 PR per bullet).

1. Minimal test coverage
   - Spec minime per `PostsStore` (happy path + edge reload) e `ToastService` (show/hide).
   - Valutare spec per `AuthGuard` e `PostsApiService`.

Note: prima di chiudere, esegui i controlli rapidi in locale (lint, subset di test). Full test runs and production builds should run in CI; do not require full production builds locally for every PR unless explicitly documented.
