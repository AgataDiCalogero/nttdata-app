# 🔧 Refactoring Checklist - NTTData App

This document tracks all refactoring tasks to improve code organization, eliminate duplication, and maintain enterprise-level structure according to the AI_GUIDELINES.md.

## ✅ Completed

- [x] Fix SCSS deprecation warning in post-form.scss (line 78)
- [x] Fix SCSS deprecation warning in post-form.scss (line 80 - transition placement)
- [x] Update AI_GUIDELINES.md with code organization best practices

## 🔴 Critical - Bundle Size Issues

### 1. Split posts.scss (Budget Exceeded: 6.76 kB / 4.00 kB)

#### Priority: HIGH - Task 1

- [ ] Extract button styles to `src/styles/_buttons.scss`
- [ ] Extract form styles to `src/styles/_forms.scss`
- [ ] Extract card styles to `src/styles/_cards.scss`
- [ ] Extract pagination styles to `src/styles/_pagination.scss`
- [ ] Import these partials in posts.scss
- [ ] Verify bundle size is under 4 kB

## 🎨 Centralize Duplicated Styles

### 2. Button Styles (Duplicated across multiple files)

#### Priority: HIGH - Task 2

**Files affected**: `posts.scss`, `comment-form.scss`, `user-form.scss`

- [ ] Create `src/styles/_buttons.scss` with:
  - `.btn` base styles
  - `.btn--primary` (orange accent)
  - `.btn--secondary` (ghost/outline)
  - `.btn--danger` (red/destructive)
  - `.btn--ghost` (transparent)
  - `.btn--icon` (icon-only buttons)
  - Disabled states
  - Size modifiers (`.btn--sm`, `.btn--lg`)
- [ ] Import `_buttons.scss` in `src/styles.scss`
- [ ] Remove duplicated button styles from:
  - `src/app/features/pages/posts/posts.scss`
  - `src/app/shared/comments/comment-form/comment-form.scss`
  - `src/app/features/pages/users/user-form/user-form.scss`
- [ ] Update HTML templates to use consistent button classes

### 3. Form Field Styles (Duplicated across multiple files)

#### Priority: HIGH - Task 3

**Files affected**: `post-form.scss`, `comment-form.scss`, `user-form.scss`

- [ ] Create `src/styles/_forms.scss` with:
  - `.form-field` base styles
  - `.form-label` styles
  - `.form-input`, `.form-select`, `.form-textarea` styles
  - `.form-error` / `.field-error` styles
  - `.form-hint` / `.field-hint` styles
  - Focus states (`:focus-visible`)
  - Disabled states
  - Validation state styles
- [ ] Import `_forms.scss` in `src/styles.scss`
- [ ] Remove duplicated form styles from:
  - `src/app/features/pages/posts/post-form/post-form.scss`
  - `src/app/shared/comments/comment-form/comment-form.scss`
  - `src/app/features/pages/users/user-form/user-form.scss`
- [ ] Update HTML templates to use consistent form classes

### 4. Card/Surface Styles

#### Priority: MEDIUM - Card/Surface Styles

- [ ] Create `src/styles/_cards.scss` with:
  - `.card` base styles
  - `.card__header`, `.card__body`, `.card__footer` elements
  - Hover states
  - Shadow/elevation variants
- [ ] Extract `.posts-card` styles from posts.scss
- [ ] Make card styles reusable across the app

### 5. State/Alert Styles (Error, Loading, Empty)

#### Priority: MEDIUM - State/Alert Styles

- [ ] Create `src/styles/_states.scss` with:
  - `.state` base styles
  - `.state--error`
  - `.state--loading`
  - `.state--empty`
  - `.state--success`
- [ ] Use across all components that show loading/error/empty states

### 6. Skeleton Loading Styles

#### Priority: LOW - Skeleton Loading

- [ ] Create `src/styles/_skeleton.scss` with:
  - `.skeleton` base class
  - `@keyframes skeleton-shimmer`
  - Skeleton variants for different content types
- [ ] Remove from posts.scss and reuse

## 🔨 Split Large Components

### 7. Posts Component (posts.ts)

#### Priority: MEDIUM - Posts Component

**Estimated lines**: ~300+

- [ ] Analyze posts.ts component size
- [ ] If >300 lines, extract:
  - [ ] Post list logic into `PostListComponent`
  - [ ] Post card into `PostCardComponent`
  - [ ] Post filters into `PostFiltersComponent`
  - [ ] Pagination logic into `PaginationComponent` (or directive)
  - [ ] Comments section into separate component
- [ ] Create appropriate folder structure under `src/app/features/pages/posts/components/`

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

#### Priority: HIGH - Task 9

- [ ] Split into modular files:
  - [ ] `posts.scss` - main layout only
  - [ ] `posts-card.scss` - card component styles
  - [ ] `posts-filters.scss` - filter toolbar styles
  - [ ] `posts-comments.scss` - comments section styles
  - [ ] Import in main posts.scss or component files

## 🗂️ Code Organization Improvements

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

## 📝 HTML Template Optimization

### 15. Extract Repeated Template Patterns

#### Priority: MEDIUM

- [ ] Identify repeated HTML patterns:
  - [ ] Form error display
  - [ ] Loading spinners
  - [ ] Empty state messages
  - [ ] Action button groups
- [ ] Create small presentational components for these
- [ ] Use `@if` / `@for` consistently

## 🎯 Testing & Quality

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

## 📊 Progress Summary

- **Total Tasks**: 17
- **Completed**: 3
- **High Priority**: 6
- **Medium Priority**: 6
- **Low Priority**: 5

## 🚀 Recommended Implementation Order

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

**Note**: Update this checklist as tasks are completed. Use git commits to track progress. Each task should be a separate, reviewable commit when possible.
