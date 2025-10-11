# Refactoring Checklist - Extended Plan

Keep every bullet as its own PR/commit. Update this file as work lands.

## Phase 0 - Foundations _(blocking)_

- [x] CI on PRs: add .github/workflows/ci.yml running npm run lint, npm run test:ci -- --code-coverage --watch=false, npm run build:ci, uploading coverage artifacts.
- [x] PR template: create .github/PULL_REQUEST_TEMPLATE.md including the enterprise checklist.
- [x] ADR: document architecture standards in docs/adr/0001-architecture-standards.md (standalone, signals, OnPush, zoneless).

## Phase 1 - A11y & Error UX

- [x] Toast/Alert accessibility: ensure role="status", aria-live="polite", keyboard dismissal, and English-only copy in shared/ui/toast (remove duplicates).
- [ ] Lists & controls audit: verify every <ul>/<ol> has only <li> children; ensure interactive elements are native controls with accessible labels. Next: review posts/comments markup after users table refactor.
- [x] Error mapping: add shared/utils/error-mapper.ts and update errorInterceptor (and auth interceptor as needed) to centralize handling for 401/403/422/429, including retry/backoff guidance on 429.

## Phase 2 - Performance & State

- [ ] OnPush everywhere: set ChangeDetectionStrategy.OnPush and host metadata for app shell, navbar, login, footer, Users, Posts.
- [ ] Signals migration: replace local BehaviorSubject usage with signal/computed where sharing is unnecessary.
- [ ] Posts decomposition: split the 360+ LOC Posts route into a container + presentation components and extract orchestration into a dedicated service.

## Phase 3 - Styling & Design System

- [ ] SCSS utilities: confirm buttons/forms/states/skeleton/appearance live under src/styles/ partials and are imported per feature.
- [ ] color-mix() fallbacks: add RGBA fallbacks (via mixin) before modern declarations across feature styles. Partial: users table updated; sweep remaining components.
- [ ] NgOptimizedImage: switch static assets (logo, illustrations) to ngSrc with intrinsic dimensions.

## Phase 4 - Testing >=60%

- [ ] Bootstrap specs: cover AuthService, AuthGuard, PostsApiService, UsersApiService, errorInterceptor, one feature container (Users or Posts), and ToastService.
- [ ] Coverage gate: configure CI to fail below 60 percent statement coverage.

---

Reminder: run npm run lint, npm run test:ci -- --code-coverage, and npm run build:ci before marking tasks complete.
