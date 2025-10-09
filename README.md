# Angular Project for NTT DATA

Single-page Angular application built on top of the public GoREST API to manage users, posts, and comments. The project serves as an end-to-end exercise: token-based authentication, protected navigation, CRUD flows, and a consistent UX with dark/light theming.

## Tech Stack & Tooling

- Angular 20 with standalone components, lazy routing, and zoneless change detection (`provideZonelessChangeDetection`)
- Angular CDK `Dialog` for modal/drawer experiences
- `lucide-angular` icons
- Custom dark/light theme persisted with signals + `localStorage`
- Quality gates: ESLint, Prettier, Husky, lint-staged, Karma + Jasmine

## Completed Features

- **Authentication & security**
  - Token login with SSR-safe persistence via `AuthService`
  - Route guard and HTTP interceptors for bearer tokens and 401 redirects
  - API prefix interceptor that rewrites relative URLs to `https://gorest.co.in/public/v2`
  - Navbar logout that clears the session token
- **Application structure**
  - Lazy routes for login, users list, user detail, and posts
  - Shared navbar with theme toggle, navigation, and logout state awareness
  - Centralised typed services (`UsersApiService`, `PostsApiService`) now grouped under `src/app/services`
- **User management**
  - Debounced search, sorting, and client-side pagination synced with query params
  - Responsive modal/drawer for create/edit with validation and error mapping (422/429)
  - Delete confirmation dialog with optimistic UI update and toast feedback
- **Post management**
  - Server-side search by title, author filter, pagination size selector, skeleton states
  - Comment viewer with caching per post, lazy loading, and toast-based error handling
  - Comment composer embedded in both the posts list and user detail pages
  - Post creation modal/drawer with validation, feedback toasts, and roster preload
  - Post deletion workflow with confirmation dialog, loading guard, and automatic refresh
- **User detail**
  - Full profile view plus the user’s posts, each with inline comment loading/creation
- **UX polish**
  - Accessible focus styles, WCAG-friendly palette, 8pt spacing system
  - Toast notifications for all success/error states
- **Workflow**
  - Husky hooks: lint-staged on pre-commit, full lint/test/build on pre-push
  - Shared Prettier config (HTML included) and modern ESLint setup for Angular 20

## Backlog (per project requirements)

- [ ] Unit test suite covering services, guards, and components (≥60% coverage)
- [ ] Evaluate additional module boundaries and advanced lazy loading
- [ ] Prepare the final presentation deck (PDF) once the scope stabilises

## Local Setup

### Prerequisites

- Node.js 20.x (recommended for Angular 20 toolchain)
- npm 10.x
- Personal access token from <https://gorest.co.in/consumer/login> (store it securely)

### Installation

```bash
npm install
```

### Development server

```bash
npm start
```

Navigate to `http://localhost:4200`, enter your token on first access, and the value will remain in `localStorage` until logout.

### Production build

```bash
npm run build
```

Artifacts are available under `dist/nttdata-app/`. CI scripts (`npm run build:ci`) run the same build with production config.

### Lint & tests

```bash
npm run lint
npm test        # interactive Karma run
npm run test:ci # headless Chrome run (pre-push hook)
```

> Note: custom spec files are pending; increasing coverage to the required 60% is tracked in the backlog.

## Project Structure (high level)

- `src/app/core`: cross-cutting concerns (auth, interceptors, theme)
- `src/app/features/auth`: login page
- `src/app/features/pages/users`: users list, CRUD modal, user detail
- `src/app/features/pages/posts`: posts list, filters, comment management, creation dialog
- `src/app/services`: shared API services (users, posts)
- `src/app/shared`: reusable layout, dialogs, toast system, comment form
- `src/app/models`: shared typings for users, posts, comments, pagination

## Contribution Notes

- All API calls pass through the shared interceptors—stick to relative URLs.
- Manage session tokens exclusively via `AuthService`.
- Prefer standalone components and lazy routing for new pages.
- Keep user-facing copy in English, and run `npm run lint` before every commit.
