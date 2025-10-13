# 0001 - Architecture standards

Status: Proposed

## Context

This repository follows modern Angular patterns with a focus on Signals, standalone components, and accessibility.

## Decisions

- Use Signals for local component state and `computed()` for derived state.
- Prefer standalone components where possible.
- Set `ChangeDetectionStrategy.OnPush` on UI components and shell (App, Navbar, Footer).
- Do not use `@HostBinding` / `@HostListener` — use `host` metadata in `@Component`.
- Centralise HTTP error handling via an interceptor and `mapHttpError` utility.
- Use accessible patterns for transient UI such as toasts/alerts (role="status", aria-live).

## Consequences

- Consistent app behaviour for errors, toasts, and state.
- Better accessibility and predictable change detection behavior.
