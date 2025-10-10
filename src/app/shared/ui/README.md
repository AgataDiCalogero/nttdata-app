# UI Kit - NTT Data App

Libreria di componenti riutilizzabili enterprise-grade per l'applicazione NTT Data.

## Struttura

```
src/app/shared/ui/
├── alert/          # Componente per messaggi di stato (info, success, warning, error)
├── button/         # Direttiva button riutilizzabile con varianti
├── card/           # Componente card con header/body/footer slots
├── loader/         # Spinner/loader con size variants
└── toast/          # Sistema di notifiche toast con servizio centralizzato
```

## Componenti Disponibili

### AlertComponent

Alert per messaggi di stato con varianti colorate e icone.

**Uso:**

```html
<app-alert variant="error" [dismissible]="true" (dismissed)="onDismiss()">
  <svg alert-icon width="20" height="20">...</svg>
  Messaggio di errore
</app-alert>
```

**Varianti:** `info` | `success` | `warning` | `error`

---

### ButtonComponent (Directive)

Direttiva per bottoni standardizzati.

**Uso:**

```html
<button appButton variant="primary" [fullWidth]="true" [loading]="isLoading">Azione</button>
```

**Varianti:** `primary` | `secondary` | `ghost` | `danger`

---

### CardComponent

Card flessibile con slots per header, body e footer.

**Uso:**

```html
<app-card variant="frosted" padding="spacious">
  <div card-header>
    <h3>Titolo</h3>
  </div>

  <p>Contenuto principale del card</p>

  <div card-footer>
    <button appButton>Azione</button>
  </div>
</app-card>
```

**Varianti:** `default` | `interactive` | `subtle` | `frosted` | `danger` | `outline` | `ghost` | `flat`
**Padding:** `none` | `compact` | `default` | `spacious`

---

### LoaderComponent

Spinner riutilizzabile per stati di caricamento.

**Uso:**

```html
<app-loader size="medium" [text]="'Caricamento...'"></app-loader>
```

**Size:** `small` | `medium` | `large`

---

### ToastComponent + ToastService

Sistema di notifiche toast centralizzato.

**Uso nel component:**

```typescript
import { ToastService } from '@app/shared/ui/toast';

export class MyComponent {
  private toast = inject(ToastService);

  showSuccess() {
    this.toast.show('success', 'Operazione completata!');
  }

  showError() {
    this.toast.show('error', 'Si è verificato un errore', 5000);
  }
}
```

**Nel template root (app.html):**

```html
<app-toast></app-toast>
```

## Best Practices

1. **Import centralizzato**: Usa sempre `@app/shared/ui` per importare i componenti
2. **Composizione**: Combina i componenti per creare interfacce complesse
3. **Accessibilità**: Tutti i componenti includono ARIA attributes e focus management
4. **Theming**: I componenti rispettano le CSS variables del design system
5. **Standalone**: Ogni componente è standalone e può essere usato indipendentemente

## Esempi d'Uso

### Form con Alert e Button

```html
<form (ngSubmit)="onSubmit()">
  @if (error()) {
  <app-alert variant="error" [dismissible]="true"> {{ error() }} </app-alert>
  }

  <button appButton variant="primary" [loading]="loading()" [disabled]="loading()">Invia</button>
</form>
```

### Card Interattivo con Loader

```html
<app-card variant="interactive" [interactive]="true" (click)="onCardClick()">
  @if (loading()) {
  <app-loader size="small"></app-loader>
  } @else {
  <h3 card-header>{{ title }}</h3>
  <p>{{ description }}</p>
  }
</app-card>
```

## Sviluppo Futuro

- [ ] Input components (text, select, checkbox, radio)
- [ ] Dialog/Modal components
- [ ] Pagination component
- [ ] Tabs component
- [ ] Badge/Tag components
- [ ] Tooltip/Popover components
