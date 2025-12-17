# NTT DATA Angular App

Single-page Angular application that integrates with the public GoREST API to manage users, posts, and comments. The project showcases token-based authentication, protected routes, CRUD workflows, accessibility-first templates, theming, and i18n-ready UI built with Angular standalone components and signals.

## Stack & Architettura

- Angular 20 standalone con SSR tramite `@angular/ssr`.
- Store basati su `@ngrx/signals` per utenti e post (paginazione, filtri, cache locali).
- Interceptor HTTP: prefisso base URL, header Bearer automatico, gestione errori con toast e logout su 401.
- Struttura cartelle: `core/` (auth, guard, interceptor), `shared/` (UI kit, servizi comuni, modelli), `features/` (login, users, posts), `styles/` (design system SCSS).
- Theming/i18n/accessibilità integrati a livello di componenti standalone e servizi condivisi.

## Requisiti

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

### Autenticazione

- Come ottenere il token: autenticati su <https://gorest.co.in/consumer/login> e copia il personal access token.
- Dove inserirlo: campo token nella pagina di login (dialog di help disponibile).
- Dove viene salvato: `sessionStorage` (con migrazione da `localStorage` legacy). Nessuna opzione “remember me” per scelta progettuale; chiudendo il browser la sessione si perde.
- Come viene usato: `auth-interceptor` aggiunge `Authorization: Bearer ...`, `authGuard` protegge le rotte, `error.interceptor` intercetta 401 → `AuthService.logout()` + redirect a `/login`.

## Funzionalità principali

- Lista utenti: ricerca per nome/email, sort, paginazione, creazione/modifica/eliminazione, dettaglio utente.
- Dettaglio utente: stato attivo/inattivo, post dell’utente, commenti con cache e gestione CRUD.
- Lista post: filtri per titolo/autore, paginazione, commenti espandibili, crea/modifica/elimina post.
- UI condivisa: navbar con toggle lingua/tema/logout, toast e alert, skeleton loader, dialog di conferma.

### Key npm scripts

| Command                                   | Purpose                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run start`                           | Serve the app locally with live reload                                         |
| `npm run build` / `npm run build:ci`      | Production build (differing configs)                                           |
| `npm run test` / `npm run test:ci`        | Karma + Jasmine unit tests (watch/headless)                                    |
| `npm run lint` / `npm run lint:fix`       | ESLint with strict rules (import order, template a11y, no stray `console.log`) |
| `npm run format` / `npm run format:check` | Prettier formatting (write/check)                                              |

### Testing strategy

- **Unit/component**: `npm run test:ci` esegue Karma/Jasmine in headless Chrome con coverage (target ≥60%). Copre auth/interceptor, servizi API, store signal, UI service e componenti principali (card/list/form).

## Architecture & Documentation

- **State management**: Feature-level signal stores (`UsersStoreAdapter`, `PostsStoreAdapter`) keep normalized entity maps, pagination, and optimistic updates predictable.
- **HTTP interceptors**: API prefixing, auth header injection, and toast-backed error handling (401 logout, 429 retry/backoff).
- **Caching**: Lightweight in-memory caches for users and per-post comments (with TTL-based eviction) to avoid GoREST 429s.

## Theming, Accessibility & i18n

- **Theme switcher**: Accessible menu with Light/Dark/System presets, reading mode toggle, and persisted CSS tokens (`data-theme`) for consistent styling.
- **Language switcher**: EN/IT toggles in the navbar update translated strings via a minimal `I18nService` plus JSON dictionaries in `src/assets/i18n/`.
- **UX polish**: Debounced searches, skeleton loaders, empty/error states with retry CTAs, confirmation dialogs on destructive flows, and template-level a11y linting.

## CI & Git hygiene

GitHub Actions (`.github/workflows/ci.yml`) runs lint → unit tests → build on every push/PR. Local git hooks have been removed to keep commits lightweight—run `npm run lint && npm run test:ci` before pushing if you want the same fast feedback locally.

## Configuration

API base URLs live in `src/environments/*.ts`. Interceptors automatically prefix relative paths with the configured base URL and attach the Bearer token when available.

## Scelte progettuali

- `@ngrx/signals` al posto di NgRx classico per ridurre boilerplate e mantenere segnali reattivi vicini ai componenti standalone.
- Sessione in `sessionStorage`: persistenza limitata alla scheda/browser per evitare token dimenticati; invalidata centralmente su 401 via interceptor.
- Design system SCSS modulare: variables/tokens, mixin condivisi, temi light/dark e partial specifici per pattern UI (bottoni, form, pagination, skeleton). Card/avatar condivisi tramite mixin `app-surface-card` e `app-avatar-gradient` riusati da UserCard/PostCard.
- SSR presente ma non focus primario: rotte protette renderizzate lato server senza chiamate API, con fetch delegato al browser dopo l’hydration.

## Style governance

I layer globali sono congelati nel documento `STYLE_LAYERS.md`: ci sono i token (solo CSS vars), il partial unico per gli override MDC (e overlay), e la baseline numerica con il conteggio dei `!important`/`.mat-mdc-`/`.cdk-overlay-` che servono a capire se stiamo migliorando. Qualsiasi modifica ai layer o ai Material overrides deve seguire i checkpoint di Milestone 0–6 (vedi il documento) e aggiornare i contatori `rg` indicati lì.
