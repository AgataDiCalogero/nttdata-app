# UI Kit - NTT Data App

Libreria di componenti riutilizzabili per l'applicazione NTT Data.

## Struttura

```text
src/app/shared/ui/
├── alert/
├── button/
├── card/
├── loader/
└── toast/
```

## Principi di progetto

- Tutti i componenti sono standalone e usano Signals per lo stato locale.
- Preferire segnali e `@if`/`@for` nelle view. Quando si passano dati ai figli, passare valori (es. `items()`), non InputSignals.
- I componenti UI espongono API semplici e testabili (signals o metodi), e gestiscono l'accessibilità (ARIA, focus management).
- For interoperability with RxJS code, feature stores should expose a tiny bridge (for example `asObservable()` or `toObservable()`), while keeping the signal store as the canonical source-of-truth.

## Esempi d'uso (Signals)

Form con alert e button:

```html
<form (ngSubmit)="onSubmit()">
  @if (error()) {
  <app-alert variant="error" [dismissible]="true">{{ error() }}</app-alert>
  }

  <button appButton variant="primary" [loading]="loading()" [disabled]="loading()">Invia</button>
</form>
```

List rendering (ensure valid list children):

```html
<ul>
  @for (post of posts(); track post.id) {
  <li>
    <app-post-card [post]="post"></app-post-card>
  </li>
  }
</ul>
```

Toast usage (service)

```ts
import { ToastService } from './toast/toast.service';

export class MyComponent {
  private toast = inject(ToastService);

  showSuccess() {
    this.toast.show('success', 'Operazione completata con successo.');
  }
}
```

## Best practices

1. Import components from `@app/shared/ui`.
2. Prefer composition over large monolithic components.
3. Expose a minimal RxJS bridge from feature stores only when necessary.
4. Keep templates simple: call signals (e.g. `items()`), avoid complex expressions in templates.

## Roadmap / TODO

- [ ] Dialog/Modal components
- [ ] Pagination component
- [ ] Tabs component
- [ ] Badge/Tag components
- [ ] Tooltip/Popover components
