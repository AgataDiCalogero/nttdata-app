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

## Avoid

- Persistent debug statements (`console.log`).
- Redundant dependencies or code duplication.
- Hardcoded secrets or tokens.
- Large monolithic files (split when >300 lines).

Following these rules keeps the codebase consistent and approachable for every contributor—human or AI.
