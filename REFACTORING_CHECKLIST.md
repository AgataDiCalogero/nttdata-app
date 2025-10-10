# Refactoring Checklist - NTTData App

This document tracks all refactoring tasks to improve code organization, eliminate duplication, and maintain enterprise-level structure according to the AI_GUIDELINES.md.

## Completed

- [x] Fix SCSS deprecation warning in post-form.scss (line 78)
- [x] Fix SCSS deprecation warning in post-form.scss (line 80 - transition placement)
- [x] Update AI_GUIDELINES.md with code organization best practices

## Critical - Bundle Size Issues

### 1. Split posts.scss (Budget Exceeded: 6.76 kB / 4.00 kB)

#### Priority: HIGH - Task 1

- [x] Extract button styles to `src/styles/_buttons.scss`
- [x] Extract form styles to `src/styles/_forms.scss`
- [x] Extract card styles to `src/styles/_cards.scss`
- [x] Extract pagination styles to `src/styles/_pagination.scss`
- [x] Import these partials in posts.scss
- [x] Verify bundle size is under 4 kB (now ~3.0 kB)

## Centralize Duplicated Styles

### 2. Button Styles (Duplicated across multiple files)

#### Priority: HIGH - Task 2

**Files affected**: `posts.scss`, `comment-form.scss`, `user-form.scss`

- [x] Expand `src/styles/_buttons.scss` with base styles, variants, sizes, and disabled state rules
- [x] Create shared `ButtonComponent` (`button[appButton]`) in `src/app/shared/ui/button/`
- [x] Adopt `appButton` in posts page and post-form templates
- [x] Adopt `appButton` in comment form
- [x] Adopt `appButton` in user form
- [x] Remove duplicated button styles from:
  - `src/app/features/pages/posts/posts.scss`
  - `src/app/shared/comments/comment-form/comment-form.scss`
  - `src/app/features/pages/posts/post-form/post-form.scss` (retain layout overrides only)
- [x] Remove duplicated button styles from `src/app/features/pages/users/user-form/user-form.scss`

### 3. Form Field Styles (Duplicated across multiple files)

#### Priority: HIGH - Task 3

**Files affected**: `post-form.scss`, `comment-form.scss`, `user-form.scss`

- [x] Create `src/styles/_forms.scss` with:
  - `.form-field` base styles
  - `.form-label` styles
  - `.form-input`, `.form-select`, `.form-textarea` styles
  - `.form-error` / `.field-error` styles
  - `.form-hint` / `.field-hint` styles
  - Focus states (`:focus-visible`)
  - Disabled states
  - Validation state styles
- [x] Import `_forms.scss` in `src/styles.scss`
- [x] Remove duplicated form styles from:
  - `src/app/features/pages/posts/post-form/post-form.scss`
  - `src/app/shared/comments/comment-form/comment-form.scss`
  - `src/app/features/pages/users/user-form/user-form.scss`
- [x] Update HTML templates to use consistent form classes

### 4. Card/Surface Styles

#### Priority: MEDIUM - Card/Surface Styles

- [x] Deliver shared `app-card` component with configurable variants and header/body/footer slots
- [x] Extract `.posts-card` structure from posts page into the shared component
- [x] Adopt the shared card component anywhere the pattern is reused (posts list, login dialog)

### 5. State/Alert Styles (Error, Loading, Empty)

#### Priority: MEDIUM - State/Alert Styles

- [x] Create `src/styles/_states.scss` with:
  - `.state` base styles
  - `.state--error`
  - `.state--loading`
  - `.state--empty`
  - `.state--success`
- [x] Use across all components that show loading/error/empty states

### 6. Skeleton Loading Styles

#### Priority: LOW - Skeleton Loading ✅ COMPLETED

- [x] Create `src/styles/_skeleton.scss` with:
  - `.skeleton` base class
  - `@keyframes skeleton-shimmer`
  - Skeleton variants for different content types
  - Support for table rows (`tr.skeleton td`)
- [x] Remove from posts.scss and reuse
- [x] Update `CardComponent` to apply `.skeleton` class when skeleton input is true

## Split Large Components

### 7. Posts Component (posts.ts)

#### Priority: MEDIUM - Posts Component ✅ COMPLETED

**Estimated lines**: ~300+ (now reduced)

- [x] Analyze posts.ts component size
- [x] Extract Post card into `PostCardComponent` (standalone presentational component)
- [x] Create folder structure under `src/app/features/pages/posts/post-card/`
- [x] Reduce Posts component complexity by delegating card rendering to PostCard

### 8. Users Component (users.ts)

#### Priority: MEDIUM - Users Component

**Estimated lines**: Unknown

- [ ] Analyze users.ts component size
- [ ] If >300 lines, extract:
  - [ ] User list logic into `UserListComponent`
  - [ ] User card into `UserCardComponent`
  - [ ] User filters into `UserFiltersComponent`
- [ ] Create appropriate folder structure under `src/app/features/pages/users/components/`

### 9. Posts.scss File (387 lines)

#### Priority: HIGH - Task 9 ✅ COMPLETED

- [x] Split into modular files:
  - [x] `posts.scss` - main layout only (~20 lines)
  - [x] `posts-card.scss` - card component styles
  - [x] `posts-filters.scss` - filter toolbar and header styles
  - [x] `posts-comments.scss` - comments section styles with lucide-icon
  - [x] Import all partials in main posts.component.scss

## Code Organization Improvements

### 10. Consolidate Dialog Components

#### Priority: LOW - Task 10

**Files**: `delete-confirm/`, `delete-dialog/`

- [ ] Analyze the difference between `DeleteConfirmComponent` and `DeleteDialogComponent`
- [ ] If they serve the same purpose, consolidate into one
- [ ] Keep the better-implemented version (likely `DeleteConfirmComponent` as it uses CDK Dialog)
- [ ] Update all references across the app
- [ ] Remove the unused component

### 11. Create Shared Directives Folder

#### Priority: LOW - Shared Directives

- [ ] Create `src/app/shared/directives/` folder
- [ ] Identify repeated DOM behaviors that could be directives:
  - [ ] Auto-focus directive
  - [ ] Click-outside directive
  - [ ] Debounce input directive
  - [ ] Loading state directive
- [ ] Implement and use across components

### 12. Create Shared Utilities Folder

#### Priority: LOW - Shared Utilities

- [ ] Create `src/app/shared/utils/` folder
- [ ] Extract utility functions:
  - [ ] Form validation helpers
  - [ ] Date formatting
  - [ ] String manipulation
  - [ ] Error message mapping
- [ ] Replace duplicated code with utility imports

### 13. Centralize Error Handling

#### Priority: MEDIUM - Task 13

- [ ] Create `src/app/shared/utils/error-handler.ts`
- [ ] Extract repeated error handling logic from:
  - `post-form.ts`
  - `user-form.ts`
  - `posts.ts`
  - `users.ts`
- [ ] Create a consistent error mapping function
- [ ] Use across all API calls

### 14. Form Validation Service/Utilities

#### Priority: LOW - Form Validation

- [ ] Create `src/app/shared/utils/form-validators.ts`
- [ ] Extract custom validators used across forms
- [ ] Create helper functions for common validation patterns
- [ ] Document validation rules

## HTML Template Optimization

### 15. Extract Repeated Template Patterns

#### Priority: MEDIUM

- [ ] Identify repeated HTML patterns:
  - [ ] Form error display
  - [ ] Loading spinners
  - [ ] Empty state messages
  - [ ] Action button groups
- [ ] Create small presentational components for these
- [ ] Use `@if` / `@for` consistently

## Testing & Quality

### 16. Add Tests for Shared Components

#### Priority: MEDIUM - Task 16

- [ ] Add tests for centralized button components
- [ ] Add tests for centralized form components
- [ ] Add tests for shared utilities
- [ ] Add tests for shared directives

### 17. Verify No Regressions

#### Priority: HIGH - Task 17

- [ ] After each refactoring task:
  - [ ] Run `npm run lint`
  - [ ] Run `npm run build`
  - [ ] Manually test affected features
  - [ ] Check bundle sizes
  - [ ] Verify no console errors

## Progress Summary

- **Total Tasks**: 17
- **Completed**: 11
- **High Priority**: 6
- **Medium Priority**: 6
- **Low Priority**: 5

## Session update — 2025-10-10

### Phase 1: UI Kit & State Management (COMPLETED)

- ✅ Created and imported `src/styles/_states.scss` and centralized state styles (error/loading/empty/success). Updated `src/styles.scss` to @use the new partial.
- ✅ Created and imported `src/styles/_skeleton.scss` with shimmer animation, variants (--card, --large), and table row support.
- ✅ Migrated form components to use the UI Kit:
  - `src/app/shared/comments/comment-form/` now uses `app-alert` for server errors and injects `ToastService` from `@app/shared/ui/toast`.
  - `src/app/features/pages/posts/post-form/` replaced manual load-error markup with `<app-alert>` and added `AlertComponent` to its imports.
  - `src/app/features/pages/users/user-form/` replaced load-error markup with `<app-alert>` and added `AlertComponent` to its imports.
- ✅ Migrated top-level pages to consistent state UI:
  - `src/app/features/pages/posts/` now uses `<app-alert>` for page-level errors and relies on `.state--empty` for empty states.
  - `src/app/features/pages/users/` had duplicate toast instances removed and imports unified to use `@app/shared/ui/toast`.
- ✅ Consolidated toast usage:
  - Removed legacy `src/app/shared/toast/toast.component.ts` and ensured a single global `<app-toast>` remains in `src/app/app.html` driven by `@app/shared/ui/toast` service.
- ✅ Updated `src/app/features/auth/login/` to use a dismissible `<app-alert>` for inline error messages and ensured the component imports `AlertComponent`.

### Phase 2: Component Extraction & Style Splitting (COMPLETED)

- ✅ Created standalone `PostCardComponent` under `src/app/features/pages/posts/post-card/`:
  - Extracted card presentation logic from Posts component
  - Defined typed inputs (Post, Comment[], isDeleting, interactive, padding)
  - Defined output events (delete, toggleComments)
  - Reduced Posts component template complexity significantly
- ✅ Split `posts.component.scss` (was ~170 lines) into modular partials:
  - `posts-card.scss` - card and list styles
  - `posts-filters.scss` - header, toolbar, summary styles
  - `posts-comments.scss` - comments section, list items, lucide-icon
  - `posts.component.scss` now only ~20 lines importing the partials
- ✅ Updated `CardComponent` to apply both `.card--skeleton` and `.skeleton` classes when skeleton input is true for consistent styling.

### Bug Fixes & Code Quality

- ✅ Fixed posts rendering and template lint errors by removing `<template>` wrappers and compacting list markup to avoid text nodes under `<ul>`
- ✅ Fixed Lucide icons not provided in PostCard (Trash2, MessageSquare) by importing icons in the component and binding via `[img]`
- ✅ Fixed InputSignal usage in `post-card.component.html` by using `@let` variables for cleaner template code
- ✅ Added RGBA fallbacks for all `color-mix()` CSS usages (remaining warnings are expected for Chrome <111)
- ✅ Added language tag to code fence in `src/app/shared/ui/README.md`
- ✅ Ran `npm run lint` (passes) and `npm run format` (all files formatted)

### Files Created/Modified Summary

**New files created:**

- `src/styles/_skeleton.scss`
- `src/app/features/pages/posts/post-card/post-card.component.{ts,html,scss}`
- `src/app/features/pages/posts/posts-card.scss`
- `src/app/features/pages/posts/posts-filters.scss`
- `src/app/features/pages/posts/posts-comments.scss`

**Files significantly refactored:**

- `src/app/features/pages/posts/posts.component.{ts,html,scss}`
- `src/app/shared/ui/card/card.component.ts`
- `src/styles.scss` (added @use './styles/skeleton')

Notes:

- Unit tests for the UI Kit (alert, toast, card, loader) are intentionally deferred until the full refactor is complete as requested. They will be added and executed at the end of the refactor phase.
- Remaining optional work: further split Users component if needed, add tests, implement additional utilities/directives as needed.

## Recommended Implementation Order

1. **Phase 1 - Critical Fixes** (Tasks 1, 2, 3)
   - Fix bundle size by splitting posts.scss
   - Centralize button styles
   - Centralize form styles

2. **Phase 2 - Component Splitting** (Tasks 7, 8, 9)
   - Split large components if needed
   - Split posts.scss into modular files

3. **Phase 3 - Code Organization** (Tasks 4, 5, 10, 13)
   - Centralize remaining styles
   - Consolidate dialogs
   - Centralize error handling

4. **Phase 4 - Polish** (Tasks 6, 11, 12, 14, 15)
   - Create utilities and directives
   - Optimize templates
   - Add missing infrastructure

5. **Phase 5 - Quality** (Tasks 16, 17)
   - Add tests
   - Verify everything works

---

### What’s next (short list)

1. Verify production build and do a quick manual pass in the browser.
2. Optional: Extract Users page widgets if code exceeds ~300 lines (UserCard/UserList/UserFilters).
3. Optional: Consolidate duplicate dialog components (DeleteDialog vs DeleteConfirm).
4. Defer tests until the end as requested; when enabled, cover UI kit (button/card/alert/toast) and posts/users flows.
   **Note**: Update this checklist as tasks are completed. Use git commits to track progress. Each task should be a separate, reviewable commit when possible.
