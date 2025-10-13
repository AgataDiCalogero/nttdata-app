# Refactoring checklist: RxJS migration

Obiettivo
-- Migrare l'interoperabilità verso RxJS dove necessario, mantenendo i signal store come source-of-truth. Questo documento definisce un piano pratico, task concreti, file da toccare, test richiesti, stime e rollback.

Approccio (due opzioni)

- Opzione A — Signals-first (consigliata): mantenere i feature stores basati su Signals e aggiungere un piccolo bridge RxJS (`asObservable()` / `toObservable()`) per i consumatori che richiedono Observables (legacy o librerie). Vantaggi: minimo impatto, performance, retrocompatibilità. Raccomandata per rollout graduale.
- Opzione B — Full RxJS: convertire i store per esporre Observables come API primaria. Vantaggi: uniformità con codebase RxJS; Svantaggi: più lavoro, rischio più alto, necessità di riscrivere consumatori templates o wrapper.

Raccomandazione: partire con Opzione A (Signals-first + bridge) e solo in caso di esigenze forti passare a Opzione B.

High-level steps

1. Audit iniziale (1–2d)
   - Identificare i feature stores esistenti (`src/app/**/store/*`) e quanti consumatori RxJS esistono.
   - Elencare le dipendenze esterne che richiedono Observables.
   - Verificare le aree che già mappano errori o si basano su HttpInterceptor (es. `error.interceptor.ts`, `token-validation.service.ts`).

2. Implementare un esempio di bridge (2–4h)
   - Scegliere un piccolo feature store (es. `PostsStore`).
   - Aggiungere `asObservable()` che ritorna `toObservable` o `signal.toObservable()` (meglio esportare `toObservable` dall'API interna se serve).
   - Aggiungere test unitaria che sottoscrive l'observable, modifica il signal e verifica l'evento ricevuto.

3. Documentazione & Pattern (2–4h)
   - Aggiornare `AI_GUIDELINES.md`, `README.md` e `src/app/shared/ui/README.md` con pattern bridge example.
   - Scrivere un piccolo snippet di esempio nel progetto (README) su come usare il bridge.

4. Migrazione incrementale (per feature)
   - Per ogni feature (Posts, Users, Comments):
     - Aggiungere bridge al store.
     - Aggiornare 1 consumer RxJS (o creare un adapter) e aggiungere test.
     - Aprire PR piccolo e indipendente.

5. Error handling consolidation (1–2d)
   - Centralizzare l'error mapping (`error-mapper.ts`) (già presente) e rimuovere duplicazioni (es. `TokenValidationService` è stato aggiornato per usare `mapHttpError`).
   - Valutare se le policy di retry e toast rimangono nel `error.interceptor` oppure devono essere mosse in servizi specifici (consiglio: lasciare la logica cross-cutting in `error.interceptor`, esporre dettagli per i local handlers quando `X-Skip-Global-Error` è presente).

6. Testing & CI (1–2d)
   - Aggiungere unit tests per i bridge e per i servizi che consumano le Observable bridges.
   - Aggiornare pipeline CI per eseguire i nuovi test. Non obbligare a heavy local builds: mantenere lint + subset tests come requisito locale.

7. Rollout & Monitoring (ongoing)
   - Monitorare errori in staging (sentry/console) e misurare regressioni.
   - Progressivamente aggiungere bridge ad altri store e deprecare pattern duplicati.

Concrete tasks (file-level)

- Audit & discovery
  - `grep src/app -n "signal\(|toSignal\(|store"` (manual)
- Implement example bridge
  - `src/app/features/posts/store/posts.store.ts` (o where PostsStore lives): add `asObservable()`.
  - `src/app/features/posts/store/posts.store.spec.ts`: new unit test for the bridge.
- Error handling consolidation
  - `src/app/shared/utils/error-mapper.ts`: canonical mapper (already present) — ensure coverage.
  - `src/app/core/auth/token-validation.service.ts`: already updated to use `mapHttpError` (verify with tests).
  - `src/app/core/interceptors/error.interceptor.ts`: ensure it attaches `uiError` and respects `X-Skip-Global-Error` (already in codebase).
- Docs & guidelines
  - `AI_GUIDELINES.md` — add section describing signals-first + bridge pattern.
  - `README.md` / `REFACTORING_CHECKLIST.md` — add migration plan and examples.

Tests to add

- Bridge tests (per store):
  - Happy path: subscriber receives new data after store update.
  - Unsubscribe: ensure no memory leaks (complete or finite streams where applicable).
- TokenValidationService tests:
  - Simulate 401, 429, network errors and assert `TokenValidationResult` mapping.
- Error interceptor tests:
  - Request with `X-Skip-Global-Error` should rethrow with attached `uiError` but not trigger global actions (toast/redirect). Use spies on `ToastService` and `Router`.

Estimates (rough)

- Audit: 1–2 days
- Example bridge + tests: 0.5–1 day
- Per-feature bridge migration: 0.5–2 days (depends on feature complexity)
- Error-handling consolidation + tests: 1–2 days
- Docs + PRs + CI updates: 0.5–1 day

Rollback plan

- Keep each change minimal and behind feature PRs. If a regression is found, revert the specific PR. Do not merge large sweeping changes in a single PR.
- Add feature flags where behaviour risk is high (e.g., toggle new bridge usage) and run A/B if needed.

Acceptance criteria

- Each migrated feature has unit tests that cover the bridge behavior.
- CI green on all PRs and no regressions in staging.
- Error handling messages remain consistent (one `error-mapper.ts`).

Notes & gotchas

- Do not remove signals from stores initially; the bridge should be an additive API.
- Prefer time-boxed refactors per feature to keep reviews small.
- If substantial code duplication remains, consider a follow-up migration to full RxJS for that feature only.

Next immediate tasks (what I'll do next if you confirm)

1. Implement `asObservable()` in an example store (PostsStore) with a unit test.
2. Add a test for `TokenValidationService` to solidify the mapping.
