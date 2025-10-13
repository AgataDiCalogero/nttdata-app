# Angular Project – Internal Delivery Notes

## Mission & Context

- **Client:** NTT DATA (global IT & digital services provider, Top Employer Italy 2022).
- **Business goal:** Enable citizens to share ideas and reports that improve urban life (cultural heritage, nature, social/environmental ties).
- **Outcome for learners:** Completed project is reviewed by NTT DATA recruiters; past students have been hired through this funnel.

## Functional Requirements (v1)

1. **Authentication**
   - Accept only GoRest API tokens generated via [GoREST login](https://gorest.co.in/consumer/login).
   - Persist token and attach as HTTP Bearer for all API requests.
   - Provide logout action.
2. **Users – Listing**
   - Search by name/email.
   - Control number of records shown.
   - Create and delete users.
3. **User Detail Page**
   - Display full user profile.
   - List that user’s posts.
   - Show comments for each post.
   - _Optional (recommended):_ allow adding comments to each post directly from this page.
4. **Posts Section**
   - List all posts with searching/filtering.
   - Display comments per post.
   - Allow creating posts.
   - _Optional:_ adding comments (now covered in the requirement above if implemented globally).
5. **Testing**
   - Unit test coverage ≥ 60% (`npm run test:ci -- --code-coverage` is enforced in CI).
6. **Architecture**
   - Angular best practices (standalone or modular is fine; optional lazy loaded modules).
   - Clear separation of components/services.
   - README describing setup, scripts, external libs.
7. **Version Control & Presentation**
   - Host project on a public GitHub repo with documentation.
   - Prepare a PDF presentation (e.g. Canva) summarising choices; include GitHub link.

## Technology Expectations

- Angular latest stable.
- REST integration against GoRest APIs; study response shapes and status codes.
- Design polish is appreciated but not mandatory; accessibility and responsive behaviour are.
- Third-party UI libraries (Angular Material, PrimeNG, etc.) are allowed.
- **State management:** NgRx (or similar) is appreciated but _not mandatory_. Prefer feature-level signal stores; when RxJS interoperability is required, expose a bridge API (e.g. `asObservable()` / `toObservable()`) from the store service so RxJS consumers can subscribe. See “State Strategy” below.

## Evaluation Focus

1. **Documentation** – README completeness, library list, setup steps.
2. **Architecture** – Modularity, lazy loading (if used), clean separation of concerns.
3. **Code Quality** – Readability, maintainability, best practices.
4. **Testing** – Coverage threshold and meaningful specs.
5. **UI/UX** – Coherent layout, responsive design, accessible interactions.

## Current State Snapshot (2025‑10‑13)

- Auth flow implemented with signal-based reactive form; token validation via API.
- Users surface includes list + CRUD; **detail page is missing** (must be prioritised next).
- Posts area supports browsing, creation, comment listing/creation, and inline edits (work‑in‑progress).
- No NgRx today; business logic relies on feature stores built with Angular signals.

## State Strategy (NgRx vs Signals)

- NgRx is optional but adds value for:
  - Predictable state transitions.
  - Easier debugging (Redux devtools).
  - Clear separation of async flows (effects).
- Our signal-based store is lightweight and already scoped per feature.
- Recommendation: keep the signal store for now to finish P0 scope (user detail page). Expose a small RxJS bridge on feature stores for integration with RxJS-based consumers. Migrate to NgRx only when shared state complexity or team needs justify the additional complexity.

## Open Must-Do Items

1. **Build User Detail Experience**
   - Route `/users/:id` with resolver or inline load.
   - Header card (avatar, name, contact info, metadata).
   - Responsive two-column layout on desktop, stacked on mobile.
   - Section: user’s posts inside cards (Preview + CTA to view full post).
   - Embed comments for each post using the new Facebook-style UI.
   - Provide “Add comment” form per post (optional but now easy to enable).
2. **Posts UX Polish**
   - Ensure edit/delete buttons and comment composer are surfaced (requires toggle improvements).
   - Finalise focus management and loading states for comment drawers.
3. **Testing & Coverage**
   - Add specs for `PostForm`, `PostsStore`, `LoginComponent`, `errorInterceptor`, etc.
4. **Documentation Updates**
   - Update README to include new scripts/features.
   - Draft final presentation once core scope is complete.

## Design & UX Drill (for upcoming work)

- Post detail cards: keep current “Facebook” styling; always show comment composer at top.
- User list: adopt card layout with filters; include quick actions (view detail, edit, delete).
- Icons: use existing `lucide-angular` (e.g. eye/pen/trash).
- Accessibility: maintain `aria-*` attributes, focus traps in dialogs, live regions for toasts.

## Go/No-Go Checklist Before Delivery

1. Node 20 LTS environment documented for contributors.
2. CI green (lint, test:ci, build:ci). Full test and production builds are CI responsibilities; local developers should run fast local checks (lint, subset tests) before pushing.
3. ≥60% coverage in report.
4. Final pass on accessibility (keyboard nav, aria labels).
5. README and PDF presentation updated with latest screenshots and instructions.

---

_Keep this document internal; update as requirements evolve._
