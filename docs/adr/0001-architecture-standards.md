# 0001 – Architecture Standards (Angular 20)

## Status

Accepted

## Context

The project targets Angular 20 with standalone components and zoneless change detection. We need explicit standards so contributors and automation can enforce consistent, maintainable architecture.

## Decision

- Standalone components everywhere (no NgModules unless required by third parties).
- Prefer signals (`signal`, `computed`, `effect`, `input`, `output`) for local state; use RxJS only for shared or asynchronous streams.
- Apply `ChangeDetectionStrategy.OnPush` by default and rely on host metadata instead of `@HostBinding`/`@HostListener`.
- Configure routing with `loadComponent`/`loadChildren` and functional guards/resolvers using `inject()`.
- Keep HTTP concerns centralized: API prefix, auth, and error interceptors wired through `provideHttpClient`.
- Enforce accessibility: English-only copy, semantic landmarks, `aria-live="polite"` for async status (toasts/alerts), and native controls with visible focus.
- Use SCSS tokens under `src/styles/`, follow the 8pt spacing scale, and provide RGBA fallbacks before `color-mix()` declarations.

## Consequences

- Components remain small and focused (split when exceeding ~300 LOC).
- Error handling and toast UX stay consistent across features.
- Performance remains predictable under zoneless change detection thanks to signals and OnPush.
- Tooling (lint, CI, PR template) can verify deviations quickly, reducing review overhead.
