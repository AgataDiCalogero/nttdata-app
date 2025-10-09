# Progetto Angular 1 per NTT DATA

Applicazione Angular che utilizza le API pubbliche di GoREST per gestire utenti, post e commenti. Il progetto e' pensato come esercitazione completa: autenticazione a token, navigazione protetta, gestione CRUD degli utenti e lettura dei contenuti pubblicati.

## Stack tecnologico e librerie

- Angular 20 con componenti standalone, router lazy e change detection senza zone (`provideZonelessChangeDetection`)
- Angular CDK `Dialog` per modali e drawer riutilizzabili
- `lucide-angular` per le icone
- Tema light/dark gestito con `signals` e persistenza su `localStorage`
- Tooling: ESLint, Prettier, Husky, lint-staged, Karma + Jasmine

## Funzionalita' completate

- **Autenticazione e sicurezza**
  - Login a token con persistenza sicura (controllo platform per SSR)
  - `AuthService`, `authGuard` e interceptor HTTP per applicare il bearer token e reindirizzare ai login su 401
  - Interceptor dedicato per prefissare tutte le chiamate con `https://gorest.co.in/public/v2`
  - Logout rapido dalla navbar che pulisce il token e invalida la sessione
- **Struttura applicativa**
  - Routing dichiarativo con lazy load delle pagine (`/login`, `/users`, `/posts`, `/users/:id`, ecc.)
  - Navbar condivisa con toggle tema, link di navigazione e gestione utente loggato
  - Servizi tipizzati per utenti e post (`UsersApiService`, `PostsApiService`) con tipologie `User`, `Post`, `Comment`
- **Gestione utenti**
  - Lista utenti con:
    - Ricerca client-side per nome/email con debounce
    - Ordinamento su nome, email e stato
    - Paginazione client-side sincronizzata con le query string
  - Creazione e modifica utente dentro dialog/drawer responsive, con validazione dei campi e gestione errori API (422, 429, generici)
  - Eliminazione con dialog di conferma e toast di feedback
  - Toast non invasivi per successo/errore, basati su `signals`
- **Dettaglio utente**
  - Scheda completa con dati anagrafici e lista dei post collegati
  - Caricamento on demand dei commenti per ciascun post, con caching locale e stato di loading per singolo post
- **Gestione post globali**
  - Ricerca server-side per titolo con debounce e filtro autore basato sul roster utenti
  - Paginazione con scelta elementi per pagina, skeleton loader e stati empty/error gestiti
  - Commenti caricati e creati on demand con form dedicato, caching per post e feedback toast
  - Creazione nuovi post tramite dialog/drawer responsive con validazioni e conferma toast
- **Esperienza utente**
  - Tema scuro di default con toggle persistito, palette rispettosa delle WCAG
  - Skeleton loader, empty state, messaggi di errore e retry sugli elenchi
  - Convenzioni di focus e accessibilita' per input, bottoni e link
- **Qualita' e workflow**
  - Husky: `lint-staged` su pre-commit; pipeline locale su pre-push (lint, test headless, build prod)
  - Configurazione Prettier condivisa (HTML incluso), ESLint moderno con supporto Angular 20

## Backlog (da implementare in base alla traccia)

- [ ] Testing: scrivere unit test significativi per servizi, guard e componenti, raggiungendo almeno il 60% di coverage
- [ ] Valutare suddivisione multi-modulo e lazy loading avanzato (opzionale nella traccia, gia' parzialmente indirizzato con componenti standalone)
- [ ] Preparare documentazione PDF di presentazione una volta stabilizzate le funzionalita'

## Setup locale

### Prerequisiti

- Node.js 20.x (versione consigliata da Angular 20)
- npm 10.x
- Token personale generato da <https://gorest.co.in/consumer/login> (copialo in luogo sicuro: non esiste refresh)

### Installazione

```bash
npm install
```

### Avvio sviluppo

```bash
npm start
```

Apri `http://localhost:4200`. Al primo accesso digita il token personale nel form di login; verra' salvato in `localStorage` finche' non effettui logout.

### Build produzione

```bash
npm run build
```

L'output si trova in `dist/nttdata-app/`. E' disponibile anche lo script `npm run build:ci` usato nei check pre-push.

### Test e lint

```bash
npm run lint
npm test            # avvia Karma in modalita' interattiva
npm run test:ci     # esegue i test in Chrome headless (usato dal pre-push)
```

> Nota: al momento non sono presenti spec personalizzate; la coverage richiesta dalla traccia rientra nel backlog.

## Struttura progetto (alto livello)

- `src/app/core`: servizi cross-cutting (auth, interceptors, theme)
- `src/app/features/auth`: pagina login
- `src/app/features/pages/users`: lista utenti, modale di creazione/modifica, dettaglio con post/commenti
- `src/app/features/pages/posts`: elenco post con ricerca, filtro autore, paginazione, commenti e modale di creazione
- `src/app/shared`: layout (navbar, theme toggle), dialog di conferma eliminazione, sistema di toast
- `src/app/models`: tipizzazioni condivise per utenti, post e commenti

## Convenzioni aggiuntive

- Le API vengono chiamate sempre tramite gli interceptor globali; evitare URL assoluti per sfruttare il prefisso automatico
- I token vengono gestiti lato client: usare `AuthService` per leggere/impostare/invalidare la sessione
- Per nuove pagine preferire componenti standalone e lazy loading, seguendo l'approccio esistente
- Prima dei push e' consigliato eseguire `SKIP_PRE_PUSH=1 git push` solo in casi eccezionali (es. WIP), altrimenti lasciare che husky esegua i check
