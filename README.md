# NTT DATA Angular App

Single-page Angular application that integrates with the public GoREST API to manage users, posts, and comments. The project showcases token-based authentication, protected routes, CRUD workflows, accessibility-first templates, and a themed UI built with Angular standalone components and signals.

## Features

- Secure login with personal API token stored in `localStorage`
- Guard-protected areas for Users and Posts
- Users: list, search, view details, create, update, delete, and inspect related posts/comments
- Posts: list with filters (title, author), pagination, inline comments load/create/delete, and new post dialog
- Consistent design system (buttons, cards, toasts, loaders) with light/dark themes
- Accessibility-conscious focus management and ARIA labelling

## Tech stack

- Angular 20 (standalone components, Signals, `OnPush`)
- Angular Router with lazy loaded feature areas and guards
- RxJS + `@ngrx/signals` for state management
- Angular Material, Angular CDK Dialog, lucide-angular icon set
- Tooling: ESLint, Prettier, Karma + Jasmine, Husky + lint-staged

## Prerequisites

- Node.js 20+
- npm 10+
- A GoREST access token from <https://gorest.co.in/consumer/login>

## Installation

```bash
npm install
Running locally
bash

npm start
Open http://localhost:4200, paste your token on first access, and the session will persist until logout.

Quality checks
bash

npm run lint
npm test
Full CI runs (production build and headless tests) are handled separately; local development typically relies on the commands above.

Configuration
API base URLs live in src/environments/*.ts. Interceptors automatically prefix relative paths with the configured base URL and attach the Bearer token when available.

Project structure
src/app/core – guards, interceptors, theming services
src/app/features – feature modules (Auth, Users, Posts)
src/app/shared – reusable UI components, dialogs, directives, utilities
src/app/shared/services – REST clients (UsersApiService, PostsApiService, etc.)
src/app/shared/models – shared TypeScript interfaces and helper types
Testing
Unit tests target at least 60% coverage (to be completed). Tests run with Karma + Jasmine; use npm test for watch mode and npm run test:ci for headless execution.

External libraries
Angular Material & CDK (layout, dialogs, menus)
lucide-angular icon set
@ngrx/signals for signal-based stores
ngx-toastr-inspired toast service (custom)
License
This project is provided for educational purposes. Extend or replace the license terms as required for your use case.


```
