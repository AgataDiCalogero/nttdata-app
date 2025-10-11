# Angular Enterprise Guidelines for AI Assistants & Contributors

These guidelines summarize conventions for contributors and automated assistants working on this Angular project. They are intentionally concise and formatted to avoid common markdown lint issues.

## Language, accessibility & UX

- Keep user-facing text in English unless otherwise requested by stakeholders.
- Prefer native controls (`button`, `input`, `a`) and ensure keyboard accessibility, visible focus styles and ARIA where required.
- Provide semantic landmarks (`header`, `main`, `nav`, `footer`) and use `aria-live` for asynchronous status updates.

## Architecture & project layout

- Organize by feature under `src/app/` (core, shared, models, features).
- One responsibility per file; consider splitting files that exceed ~300 lines.
- Promote reusability: extract UI patterns used in more than one place into `shared/`.

## Routing

- Lazy-load feature routes using `loadComponent` / `loadChildren`.
- Use `inject()` for guards and resolvers when possible.

## Components

- Keep components small and focused. Move business logic into services.
- Prefer modern APIs: `input()` / `output()`, `signal`, `computed`, `effect`.
- Use the decorator `host` object for host bindings. Set `changeDetection: ChangeDetectionStrategy.OnPush`.

## State management

- Local component state: use signals (`signal`, `computed`, `effect`).
- Shared state: expose read-only Observables or signals from services.

## Templates

- Use the control flow constructs `@if`, `@for`, `@switch` and always provide `track` for lists.
- Avoid `ngClass`/`ngStyle`; prefer explicit class and style bindings.

## Styling & design system

- Centralize tokens and utilities under `src/styles/` as SCSS partials.
- Follow an 8pt spacing scale and BEM-like naming; provide fallbacks for modern CSS features.

## HTTP & APIs

- Use global interceptors for API prefix, auth and error mapping.
- Prefer relative URLs and surface user-friendly error messages via toast/alert components.

## Forms

- Use Reactive Forms with strongly typed controls (e.g., `FormBuilder.nonNullable`).

## Error handling & logging

- Centralize error mapping and show concise, non-sensitive messages to users. Use `aria-live="polite"` for toasts.

## Performance

- Prefer signals for template bindings. Use `NgOptimizedImage` for static assets and provide width/height.

## Testing & quality

- Add tests for non-trivial logic; keep tests fast and deterministic. Run lint and build checks before reviews.

## Tooling

- Follow ESLint and Prettier rules. Keep Husky hooks for pre-commit and pre-push checks.

## Documentation

- Keep `README.md` and ADRs updated for major design decisions.

## Quick references

- Lists: ensure `ul`/`ol` direct children are `li`, `script`, or `template`.
- Signals: use `set` or `update`; avoid `mutate`.

  src/app/
  core/ // singletons: interceptors, guards, config, logging
  shared/ // UI atoms, directives, pipes, validators, utilities
  models/ // app-level types & interfaces
  features/
  &lt;feature&gt;/
  components/ // small, focused standalone components
  pages/ // route components (lazy loaded)
  services/ // business logic, API orchestration
  store/ // feature-level signals or RxJS subjects (if shared)
  &lt;feature&gt;.routes.ts

  ```text

  ```

## 3) Routing (Lazy by default)

- Define feature routes lazily with `loadComponent`/`loadChildren`. Prefer function guards/resolvers using `inject()`.
- Keep URLs stable and descriptive; avoid breaking changes without migrations.
- Example route file:

  ```ts
  // src/app/features/todos/todos.routes.ts
  import { Routes } from '@angular/router';
  import { inject } from '@angular/core';

  export const TODOS_ROUTES: Routes = [
    {
      path: '',
      loadComponent: () => import('./pages/todos-page.component').then((m) => m.TodosPageComponent),
      canActivate: [() => inject(AuthGuard).canActivate()],
      resolve: { seed: () => inject(TodosResolver).resolve() },
    },
  ];
  ```

## 4) Components

... (file trimmed for brevity in this patch)
class="todo"
[class.todo--done]="done()"
(click)="toggle.emit(id())"
tabindex="0"
(keydown.enter)="toggle.emit(id())"
(keydown.space)="toggle.emit(id())" >
![Check mark](/assets/check.svg)

### {{ title() }}

@if (badge() as b) {
<span class="todo\_\_badge" [attr.aria-label]="b">{{ b }}</span>
}

</article>
`,
            styles: [
              `
.todo {
display: flex;
gap: var(--space-2);
align-items: center;
}
`,
],
host: { role: 'listitem' },
changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoItemComponent {
readonly id = input.required&lt;string&gt;();
readonly title = input.required&lt;string&gt;();
readonly completed = input(false);
readonly badge = input&lt;string | null&gt;(null);

readonly toggle = output&lt;string&gt;();

readonly done = computed(() => this.completed());

constructor() {
effect(() => {
if (this.done()) {
// minimal, purposeful side effects only
}
});
}
}

````

        validators: [Validators.required, Validators.maxLength(100)],
      }),
      completed: fb.nonNullable.control(false),
    });
    ```

## 10) Error Handling & Logging

- Centralize HTTP error mapping and **minimal** logging (only what helps debugging).
- Expose user-friendly messages via shared toast service with `aria-live="polite"`.
- Never leak secrets, tokens, or stack traces to the UI.

## 11) Performance & Platform Features

- Prefer signals over change‑heavy observables in templates; bridge with `toSignal()` when needed.
- Use `ChangeDetectionStrategy.OnPush` everywhere.
- Coalesce events and defer non-critical work (deferrable views, requestIdleCallback where appropriate).
- Use `NgOptimizedImage` for static images (not for inline base64); provide explicit width/height.
- Always provide `track` in `@for`.

## 12) Testing & Quality Targets

- Add/maintain unit tests for non‑trivial component/service logic. Target **≥60% coverage overall**.
- Use Angular TestBed and HTTP testing utilities. Avoid brittle snapshots.
- Keep tests fast, deterministic, and isolated. Prefer testing **behavior** over internals.

## 13) Tooling & Automation (ESLint, Prettier, Husky)

- Obey ESLint & Prettier. Run:
  - `npm run lint`
  - `npm run test:ci`
  - `npm run build:ci`
- **Husky**:
  - **pre-commit**: lint-staged → format + lint only changed files, typecheck if feasible.
  - **pre-push**: `npm run test:ci` and `npm run build:ci`.
  - Emergency skips require justification: `SKIP_PRE_PUSH=1 git push` (document in commit message).
- Keep lint rules enabled; only disable with a brief justification comment.

## 14) Documentation & Workflow

- Update `README.md` as features move from backlog → completed.
- Keep this guideline updated with new conventions.
- Record major decisions via short ADR notes in `/docs/adr/`.

## 15) Syntax Safety & Problem‑Panel Hotspots

- **Import accuracy**: Verify imports exist and are used. Remove unused imports immediately.
- **Brackets/parentheses**: Ensure pairs match and close in correct order.
- **TypeScript strictness**: No `any`. Prefer `unknown` when needed; provide explicit return types.
- **Semicolons/quotes**: Follow Prettier settings (double quotes, consistent semicolons).
- **Decorators**: Correct metadata; ensure required `imports` for standalone components/directives/pipes.
- **Template syntax**: Use correct binding forms. Avoid mixing syntax in control flow.
- **Null safety**: Use `?.` and `??` appropriately; avoid non‑null assertions unless absolutely necessary with explanation.
- **Build verification**: Code must pass `lint` and `build:ci` before review.

### 15.1 ARIA & Interactive Controls (recurring editor issues)

- Prefer native controls: `<button>`, `<input type="checkbox">`, `<input type="radio">`.
- If you must use ARIA roles (e.g., `role="switch"` or `role="checkbox"`):
  - Include required attributes: `aria-checked="true|false"` and a visible label via `aria-label` or `aria-labelledby`.
  - Ensure keyboard operability: add `tabindex="0"` if the element isn’t natively focusable and handle `Enter`/`Space`.
- **Preferred native example**:

  ```html
  <input
    type="checkbox"
    id="appearance-switch"
    class="appearance-switch"
    aria-label="Toggle appearance"
  />
````

- **If role is necessary**:

  ```html
  <div role="switch" aria-checked="false" aria-label="Toggle appearance" tabindex="0"></div>
  ```

### 15.2 Lists (`<ul>` / `<ol>`) (recurring editor issues)

- `ul`/`ol` direct children must be only `<li>`, `<script>`, or `<template>`.
- Always wrap content in `<li>` even for complex markup.
- **Incorrect**:

  ```html
  <ul>
    <h3>Section</h3>
    <li>Item 1</li>
  </ul>
  ```

- **Correct**:

  ```html
  <ul>
    <li><h3>Section</h3></li>
    <li>Item 1</li>
  </ul>
  ```

- When generating with templates, ensure the output produces `<li>` elements or wrap the result in `<li>`.

### 15.3 CSS `color-mix()` Fallbacks (recurring editor issues)

- Provide a broadly supported fallback **before** the `color-mix()` declaration.
- Prefer a separate RGB custom property (e.g., `--color-accent-rgb: 34,139,230`).
- Example:

  ```scss
  /* Fallback for older browsers */
  border-color: rgba(var(--color-accent-rgb), 0.45);
  /* Modern preferred */
  border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
  ```

- Recommended SCSS mixin:

  ```scss
  @mixin accent-transparent($alpha-percent) {
    $alpha: $alpha-percent / 100;
    border-color: rgba(var(--color-accent-rgb), $alpha);
    border-color: color-mix(in srgb, var(--color-accent) $alpha-percent%, transparent);
  }
  ```

## 16) Security & Privacy

- Never commit secrets or tokens. Use environment files and runtime configuration.
- Use interceptors to attach tokens; avoid exposing tokens in logs. Prefer HTTP‑only cookies for refresh tokens when possible.
- Sanitize any HTML input. Avoid `innerHTML` unless absolutely necessary and sanitized.
- Use `withCredentials` only when required by the backend; document the reason.

## 17) Code Reuse & Shared Elements

- Centralize repeating UI (toasts, dialogs, loaders, error banners) under `shared/` and reuse across features.
- Keep shared utilities pure and framework‑agnostic where possible.
- Do not duplicate code; extract shared logic into services/utilities.

## 18) Internationalization & Localization

- Default language is English. If localization is introduced, keep translation keys stable and use ICU messages where needed. Avoid concatenated strings in templates.

## 19) Pull Requests & Review Checklist (copy into PR template)

- [ ] English‑only user‑facing text and accessible UI.
- [ ] Standalone components; modern APIs (`signal`, `input`, `output`, `computed`).
- [ ] Lazy routes; guards/resolvers as functions with `inject()`.
- [ ] Strongly typed forms with `fb.nonNullable`.
- [ ] No absolute URLs; interceptors used; errors mapped; toasts wired.
- [ ] Template uses new control flow; explicit `track`; no `ngClass`/`ngStyle`.
- [ ] SCSS respects design tokens, 8pt scale, and includes `color-mix()` fallbacks.
- [ ] Unit tests added/updated; coverage not reduced (< 60% overall is blocked).
- [ ] ESLint/Prettier pass; `npm run lint` & `npm run build:ci` succeed.
- [ ] Husky hooks not skipped (or justified if `SKIP_PRE_PUSH=1`).
- [ ] Files >300 lines considered for splitting; no duplicated code.

---

### Quick References

- Signals: prefer `set`/`update`; keep transforms pure.
- Host bindings: use `host` object in `@Component`/`@Directive`.
- Images: use `NgOptimizedImage` for static assets with width/height.
- Observables: expose read‑only streams; bridge to signals for template consumption.
- Error UX: toast + `aria-live` region; never `alert()`.
- Lists: only `<li>` direct children; add `track` in `@for`.
- CSS: provide fallbacks before modern features like `color-mix()`.
