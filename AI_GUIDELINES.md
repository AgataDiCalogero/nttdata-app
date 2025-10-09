# Istruzioni per assistenti AI e Copilot

Questo file definisce le regole progettuali da seguire ogni volta che un assistente AI (inclusi te, GitHub Copilot, Cursor o altri strumenti simili) propone o modifica del codice in questo repository Angular.

## Architettura Angular

- Utilizzare Angular 20 con componenti standalone; niente `NgModule` se non strettamente necessario.
- Prediligere `inject()` al posto di `constructor` injection.
- Utilizzare `signals`, `computed`, `effect` per lo stato locale; evitare `BehaviorSubject` salvo casi di condivisione tra servizi.
- Mantenere le rotte lazy (`loadComponent` / `loadChildren`); usare i guard ed interceptor esistenti.
- Ogni nuova funzionalita' deve essere modellata con servizi dedicati e tipi dichiarati in `src/app/models`.

## Stile TypeScript

- Nessun utilizzo di `any`: usare tipi e interfacce esplicite.
- Funzioni brevi, con early return per evitare annidamento profondo.
- Separare responsabilita' in metodi privati leggibili; niente spaghetti code.
- Per form e input usare `ReactiveFormsModule` con controlli tipizzati (`fb.nonNullable`).
- Gestire gli errori HTTP con mapping chiaro e logging minimo (solo per debugging necessario).

## Template HTML

- Usare la nuova sintassi di controllo (`@if`, `@for`, `@switch`) con `track` esplicito.
- Garantire accessibilita': attributi `aria-*`, `role`, gestione del focus (`:focus-visible` gia' definito).
- Nessuna logica pesante nei template; spostare in getter o metodi.
- Evitare duplicazione: estrarre componenti standalone quando il markup e' riutilizzabile.

## SCSS e design system

- Le variabili globali vivono in `:root` / `.light-theme` come gia' impostato; non introdurre variabili hard-coded.
- Struttura BEM (`.blocco__elemento--modificatore`) o variante leggibile; annidamento massimo 3 livelli.
- Rispettare la spacing scale 8pt (`--space-*`); niente valori arbitrari senza commento.
- In caso di nuovi componenti, creare file SCSS dedicati e importare solo cio' che serve; evitare utility inline.
- Garantire contrasto minimo WCAG 4.5:1; se necessario aggiornare palette in modo coerente.

## HTTP e API

- Riutilizzare gli interceptor (`apiPrefixInterceptor`, `authInterceptor`, `errorInterceptor`).
- Nessun URL assoluto nelle chiamate; usare path relativo (`/resource`) per permettere il prefisso automatico.
- Gestire errori 4xx/5xx con feedback utente (toast / stato UI); evitare `alert`.
- Per operazioni che mutano stato, sincronizzare UI locale senza ricarichi completi quando possibile.

## Test e qualita'

- Ogni nuovo servizio o logica complessa richiede test unitari (target coverage >= 60% complessivo).
- Per componenti usare TestBed con harness o `ComponentFixture`; mockare HTTP con `HttpTestingController`.
- Aggiornare o aggiungere test solo se significativi; evitare snapshot fragili.

## Tooling e formato

- Rispettare ESLint e Prettier configurati nel progetto; non disattivare regole senza motivo documentato.
- Run consigliati prima di push: `npm run lint`, `npm run test:ci`, `npm run build:ci`.
- Se necessario bypassare husky (solo emergenze), documentare in commit.

## Documentazione e workflow

- Aggiornare il `README.md` (sezione funzionalita' / backlog) quando una feature passa da TODO a completata.
- Mantenere questo file allineato se le regole cambiano o nuove convenzioni vengono adottate.
- Annotare eventuali decisioni architetturali importanti in commenti brevi o file ADR separati.

## Cosa evitare

- `console.log` permanenti o debug non rimossi.
- Dipendenze non necessarie o alternative che duplicano funzionalita' gia' coperte.
- Codice duplicato tra componenti; preferire shared component / utility.
- Hard-code di token o dati sensibili; usare sempre environment variabili o parametri.

Seguire queste linee guida assicura coerenza del codice e facilita la collaborazione tra tutti gli strumenti AI e gli sviluppatori coinvolti nel progetto.
