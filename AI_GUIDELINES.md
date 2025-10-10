# Guidelines for AI Assistants and Copilot

These rules apply to every AI assistant (Codex, GitHub Copilot, Cursor, etc.) when working on this Angular project.

## General Principles

- **English only** for all user-facing text (UI labels, placeholders, README, comments) unless a stakeholder explicitly requests another language.
- Keep comments minimal, purposeful, and in English. Prefer self-documenting code; add comments only for non-obvious decisions.
- Preserve accessibility, responsiveness, and existing design tokens.

## Angular Architecture

- Use Angular 20 standalone components; avoid `NgModule` unless strictly necessary.
- Prefer `inject()` over constructor injection.
- Manage local state with `signal`, `computed`, and `effect`. Reserve `BehaviorSubject` for shared service state.
- Keep routing lazy via `loadComponent`/`loadChildren` and reuse existing guards and interceptors.
- Model new features with dedicated services and shared types in `src/app/models`.

## TypeScript Style

- No `any`. Provide explicit interfaces and types.
- Write short functions, use early returns to reduce nesting, and split responsibilities into private helpers.
- Use `ReactiveFormsModule` with strongly typed controls (`fb.nonNullable`) for forms.
- Map HTTP errors explicitly and keep logging minimal (only what helps debugging).

## Templates

- Adopt the new control flow syntax (`@if`, `@for`, `@switch`) with explicit `track` functions.
- Enforce accessibility: `aria-*` attributes, focus management (`:focus-visible` already styled), semantic markup.
- Move heavy logic to the component; keep templates declarative.
- Extract reusable markup into standalone components (e.g., dialog content, shared controls).

## SCSS & Design System

- Use the global CSS variables defined in `:root`/`.light-theme`; avoid magic values.
- Follow a BEM-like structure with max three nesting levels.
- Respect the 8pt spacing scale (`--space-*`). If deviating, explain briefly in code.
- Create feature-specific SCSS files and avoid inline utilities.
- Maintain WCAG 2.1 AA contrast or better.

## HTTP & API

- Rely on the global interceptors (`apiPrefixInterceptor`, `authInterceptor`, `errorInterceptor`).
- Do not hardcode absolute URLs; use relative paths so the prefix interceptor can adjust them.
- Provide user feedback (toast/state) for 4xx/5xx results; never use `alert` dialogs.
- After mutations, keep UI state in sync without unnecessary reloads.

## Testing & Quality

- Add or update unit tests for any non-trivial service/component logic (target ≥60% coverage overall).
- Use Angular TestBed and HTTP testing utilities; avoid brittle snapshot tests.
- Only disable lint rules with documented justification.

## Tooling

- Obey ESLint and Prettier configurations; run `npm run lint`, `npm run test:ci`, and `npm run build:ci` before pushing when possible.
- Husky skips (`SKIP_PRE_PUSH=1`) are emergency only and must be noted in commits.

## Documentation & Workflow

- Update `README.md` when a feature moves from backlog to completed.
- Keep this guideline file current with any new conventions.
- Record major architectural decisions via brief comments or separate ADR-style notes.

## Code Organization & Reusability

- **Never duplicate code** across different parts of the application. Extract shared logic into services, utilities, or shared components.
- **Centralize repeating elements** (toasts, dialogs, loaders, error handlers, etc.) into shared components or services under `src/app/shared/` and reuse them throughout the app.
- **Split large files** when HTML templates or TypeScript files become too long (generally >300 lines):
  - Extract UI sections into separate child components with their own folders
  - Move business logic into dedicated services under `src/app/services/`
  - Create custom directives for reusable DOM behavior under `src/app/shared/directives/`
  - Organize utility functions in `src/app/shared/utils/`
- Maintain an **enterprise-level structure**: each feature, component, service, and directive should have a clear single responsibility and be easy to locate and maintain.

## Syntax Error Prevention

To avoid common syntax errors and maintain high code quality:

- **Import Accuracy**: Always verify imports are correct, available, and used. Remove unused imports immediately. Use proper import paths relative to the file.
- **Bracket and Parentheses Matching**: Ensure all braces `{`, brackets `[`, parentheses `(`, and angle brackets `<>` are properly matched and closed in the correct order.
- **TypeScript Strictness**: Adhere to strict mode - no `any` types, explicit return types on functions, no implicit `any` parameters. Enable and respect all compiler flags.
- **Semicolon Consistency**: Use semicolons consistently as per project style (enforced by Prettier).
- **Angular Decorators**: Use correct decorator syntax (`@Component`, `@Injectable`, etc.) with proper metadata. Standalone components require `imports` for all used directives/pipes.
- **String Literals**: Use consistent quotes (double quotes per project convention). Escape special characters properly in strings.
- **SCSS Deprecations**: Avoid deprecated SCSS syntax. Use modern nesting, color functions, and property order. Follow the 8px grid spacing system.
- **Template Syntax**: Use correct Angular template syntax - proper brackets for bindings `[]`, parentheses for events `()`, asterisks for structural directives `*`. Avoid mixing syntax errors in control flow (`@if`, `@for`, `@switch`).
- **Null Safety**: Use safe navigation `?.`, nullish coalescing `??`, and optional chaining where appropriate. Check for potential null/undefined errors.
- **Build Verification**: Always run `npm run lint`, `npm run build:ci`, and fix any errors before considering code complete.
- **Peer Review Ready**: Write code that passes all automated checks and can be reviewed by peers without syntax errors.

### Specific rules for errors seen in the Problems panel

The project has shown recurring, specific issues in the editor Problems view (missing ARIA attributes, incorrect children inside `<ul>/<ol>`, and CSS `color-mix` compatibility). Add these concrete rules so AI-generated code avoids them.

- ARIA & interactive controls
  - Prefer native interactive elements when possible: use `<button>`, `<input type="checkbox">`, or `<input type="radio">` instead of `div`/`span` with `role` unless there is a compelling reason.
  - If you must use ARIA roles (e.g., `role="switch"` or `role="checkbox"`), always include the matching required attributes: `aria-checked` (true|false), and a visible label via `aria-label` or `aria-labelledby`.
  - Ensure keyboard operability: include `tabindex="0"` if element isn't naturally focusable, and handle `Space`/`Enter` to toggle state.
  - Example (preferred native):

    ```html
    <input
      type="checkbox"
      id="appearance-switch"
      class="appearance-switch"
      aria-label="Toggle appearance"
    />
    ```

  - Example (if role needed):

    ```html
    <div role="switch" aria-checked="false" aria-label="Toggle appearance" tabindex="0"></div>
    ```

- Lists (`<ul>` / `<ol>`)
  - A `ul` or `ol` must contain only `<li>`, `<script>`, or `<template>` as direct children. Do not place text nodes, headings, or other elements directly inside a list.
  - Always wrap list items in `<li>` even if they contain complex markup (links, headings, custom components).
  - Example (incorrect):

    ```html
    <ul>
      <h3>Section</h3>
      <li>Item 1</li>
    </ul>
    ```

  - Example (correct):

    ```html
    <ul>
      <li><h3>Section</h3></li>
      <li>Item 1</li>
    </ul>
    ```

  - When generating lists from templates, ensure the template returns `<li>` elements (or wrap the template output in `<li>`).

- CSS `color-mix()` compatibility and fallbacks
  - `color-mix()` (and some `color-mix(in srgb, ...)` forms) are not supported in older browsers (Chrome < 111 and some other engines). Do not rely on it without a fallback.
  - Provide a fallback value before the `color-mix()` declaration. CSS should list the fallback first, then the modern declaration. Example:

    ```css
    /* Fallback for older browsers */
    border-color: rgba(34, 139, 230, 0.45);
    /* Modern preferred */
    border-color: color-mix(in srgb, var(--color-accent) 45%, transparent);
    ```

  - Prefer maintaining a separate RGB CSS variable when feasible (e.g., `--color-accent-rgb: 34,139,230`) so you can derive transparent variants with `rgba()` in a cross-browser way from a single source of truth.

  - Example SCSS mixin (recommended):

    ```scss
    // Assumes you define --color-accent and --color-accent-rgb in :root
    @mixin accent-transparent($alpha-percent) {
      // translate percent to alpha (0..1) in SCSS when possible
      $alpha: $alpha-percent / 100;
      border-color: rgba(var(--color-accent-rgb), $alpha); // broad support
      border-color: color-mix(
        in srgb,
        var(--color-accent) $alpha-percent%,
        transparent
      ); // modern override
    }
    ```

  - If you can't add an RGB variable, compute a reasonable RGBA fallback manually and keep the `color-mix()` line after it.

- Editor / generation checks
  - When generating HTML, validate that ARIA-required attributes are present for any ARIA role assigned. If an attribute is required by the role, the generator must emit it.
  - When generating lists, the generator must either output `<li>` wrapper elements or explicitly document why a non-`li` direct child is used (very rare).
  - When generating styles that use newer CSS features, the generator must include a safe fallback first.

These targeted rules will reduce the Problems view noise and make generated code safer and more compatible across browsers and assistive technologies.

## Avoid

- Persistent debug statements (`console.log`).
- Redundant dependencies or code duplication.
- Hardcoded secrets or tokens.
- Large monolithic files (split when >300 lines).

Following these rules keeps the codebase consistent and approachable for every contributor—human or AI.
