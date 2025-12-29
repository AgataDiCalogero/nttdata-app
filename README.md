# nttdata-app – Applicazione Angular 20

nttdata-app è un esercizio realizzato per il percorso start2impact e NTT DATA che mette in mostra una single-page application Angular 20 (SSR opzionale) completa di autenticazione via token GoRest e gestione di utenti, post e commenti. La UI è protetta da guardie, lo stato è gestito con signals/store personalizzati e l’intera comunicazione è orchestrata da servizi dedicati.

## Requisiti funzionali implementati

| Funzionalità                                              | Stato                   | Evidenza                                                                                                    |
| --------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Login con token GoRest e validazione                      | ✅ Implementato         | `LoginComponent` con form reattivo e token validato da `LoginFacade` con alert e gestione errori            |
| Lista utenti con ricerca, ordinamento, paginazione e CRUD | ✅ Implementato         | `UsersComponent` e `UsersStore` con segnali dedicati, paginazione, sorting, modali di creazione/modifica    |
| Dettaglio utente con post e commenti                      | ✅ Implementato         | `UserDetailComponent` carica utente e post, `CommentFormComponent` gestisce l’aggiunta di commenti          |
| Lista post con filtri e operazioni CRUD                   | ✅ Implementato         | `PostsComponent` con segnali per filtri, paginazione e `PostsUiService` per creare/modificare/cancellare    |
| Autenticazione globale delle rotte                        | ✅ Implementato         | `AuthGuard`, `AuthRedirectGuard` e rotte lazy protette (users/posts/login standalone)                       |
| Logout con cancellazione token                            | ✅ Implementato         | `AuthService.logout()` cancella token da `sessionStorage` e resetta stato                                   |
| Test unitari e copertura                                  | ✅ Implementato (≥ 80%) | `karma.conf.cjs` + `npm test --watch=false --browsers=ChromeHeadless` con report coverage 80,48% statements |

## Tech stack e librerie

- Angular 20 + Angular Material 20 per struttura e componenti UI.
- `@ngrx/signals` per lo stato reattivo di utenti/post e derivazioni con signals.
- RxJS 7.8 per stream e side effect.
- Express 5 opzionale per SSR con Angular Universal (build server-side).
- ESLint/Angular ESLint con regole custom (es. divieto di MatDialog diretto, pattern `app-select`).
- Prettier per formattazione coerente.
- Karma + Jasmine per test e coverage.

## Setup locale e comandi

### Prerequisiti

1. Node.js ≥ 20 e npm ≥ 10 (`node -v`, `npm -v`).
2. Token personale GoRest con scope di lettura/scrittura.

### Installazione

```bash
npm ci
```

### Sviluppo

```bash
npm start
```

Apri `http://localhost:4200` e inserisci il token nella pagina di login.

### Build di produzione

```bash
npm run build:ci
```

Genera l’app compilata in `dist/nttdata-app`.

### SSR (opzionale)

```bash
node dist/nttdata-app/server/server.mjs
```

Serve l’app con Express (Angular Universal).

### Test & coverage

```bash
npm test               # modalità watch
npm run test:ci        # headless con ChromeHeadless
```

Il report si trova in `coverage/nttdata-app`. Per la consegna è richiesta una copertura ≥ 60% (ultimo run: 80,48% statements). Apri `coverage/lcov-report/index.html` per dettagli.

### Linting & formattazione

```bash
npm run lint
npm run lint:ci
npm run lint:fix       # opzionale
npm run format
npm run format:check
```

## Configurazione autenticazione

L’app non gestisce registrazioni: l’utente inserisce manualmente il token GoRest nel form di login. `AuthService` memorizza il token in `sessionStorage` e `AuthInterceptor` lo allega a ogni richiesta con `Authorization: Bearer <token>`. Gli errori 401 vengono intercettati da `ErrorInterceptor`, che forza il logout e mostra un messaggio contestuale. Non committare mai il token nel repository.

## Architettura e organizzazione

- `src/features`: moduli per `auth`, `users`, `posts` con rotte, componenti, store e servizi dedicati.
- `src/shared`: componenti riutilizzabili (bottoni, selettori, toast, alert, responsive dialog) e helper UI.
- `src/core`: interceptors (`ApiPrefixInterceptor`, `AuthInterceptor`, `ErrorInterceptor`), services cross-cutting e configurazioni globali (`app.config.ts`).
- Routing con lazy load (`users.routes.ts`, `posts.routes.ts`) e guardie (`authGuard`, `authRedirectGuard`).
- State management con store personalizzati basati su `@ngrx/signals` (users/posts store includono segnali per ricerca, filtraggio e pagination).
- UI Material incapsulata in wrapper per rispettare regole di design e lint (es. `ResponsiveDialogService`).

## Guida all’uso

1. Installa dipendenze (`npm ci`) e avvia l’app (`npm start`).
2. Nel login, inserisci il token GoRest e premi “Login”. Se il token è errato, viene mostrato un messaggio localizzato con focus automatico sul campo.
3. Accedi alla sezione **Utenti** tramite la navigazione, usa la barra di ricerca per filtrare per nome/email, cambia pagina o `perPage` e crea un nuovo utente con il dialog.
4. Cliccando su un utente, visualizzi i dettagli, i suoi post e i commenti; puoi aggiungere commenti dal form dedicato.
5. Nella sezione **Post**, filtri per titolo/autore, gestisci paginazione e crei/modifichi/elimini post tramite dialog validati.
6. Per uscire, usa l’icona utente/logout nell’header; il token viene rimosso e verrai riportato al login.

## Lingue, temi e modalità di lettura

- **Italiano/English**: la `LanguageSwitcherComponent` usa `I18nService` per offrire traduzioni in italiano e inglese (`assets/i18n/it.json`, `assets/i18n/en.json`), memorizzando la lingua preferita nel `localStorage` e aggiornando `document.documentElement.lang`.
- **Temi light/dark**: `ThemeService` gestisce preferenze (`light`, `dark`, `system`) e applica le classi `light-theme`/`dark-theme` al `body`, aggiornando `document.documentElement.dataset.theme` e ascoltando `prefers-color-scheme` quando la preferenza è `system`.
- **Modalità di lettura**: lo stesso servizio può accendere/spegnere la classe `reading-mode`, mantenendo il flag in `localStorage` per tornare alla vista a contrasto ridotto.

## Troubleshooting

- **EPERM su Windows durante `npm ci`**: chiudi processi `node/ng serve`, disattiva antivirus che blocca `.node`, elimina `node_modules` e reinstalla.
- **Token GoRest invalido**: verifica di avere il token corretto con permessi adeguati; gli errori 401 forzano il logout.
- **Coverage sotto il 60%**: aggiorna i test ed esegui `npm run test:ci`; controlla i file coperti nel report `coverage/nttdata-app/index.html`.

## Definition of Done

- [x] `npm ci` installa le dipendenze senza errori.
- [x] `npm start` avvia l’app su `localhost:4200`.
- [x] `npm test` e `npm run test:ci` eseguono i test e generano coverage ≥ 60%.
- [x] `npm run lint` non produce errori (warnings consentiti solo se documentati).
- [x] `npm run build:ci` genera correttamente `dist/nttdata-app`.
