````instructions
You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- **NEVER use `<template>` tags** with control flow - they are obsolete and cause errors. Use `<ng-container>` instead for wrapper-free elements
- When using `@for` or `@if`, wrap content directly or use `<ng-container>` if you need a wrapper without DOM element
- Use the async pipe to handle observables
- Example correct usage:
  ```html
  @for (item of items; track item.id) {
  <li>{{ item.name }}</li>
  }
  <!-- NOT: <template>@for (...) { ... }</template> -->
  ```

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## NgRx Signal Store Guidelines

### Overview
NgRx Signal Store is a state management solution for Angular applications built on Angular's reactive signals. It provides a simpler, more efficient alternative to traditional NgRx Store by leveraging signals for reactivity and TypeScript's type inference for type safety. When implementing NgRx Signal Store, follow the Lightweight Port and Adapter Pattern based on Hexagonal Architecture to ensure modularity, testability, and separation of concerns.

### Key Concepts
- **Hexagonal Architecture (Ports and Adapters)**: Isolate core business logic from external systems using interfaces (ports) for interactions and adapters for implementations. This enhances modularity, testability, and flexibility.
- **Type Inference**: Leverage TypeScript's type inference to reduce boilerplate, enhance readability, and ensure type safety without explicit type definitions.
- **Signals Integration**: Use Angular signals for reactive state management, avoiding traditional observables and actions where possible.

### Implementation Guidelines
- **Define Ports as Interfaces**: Create interfaces that define the contract for state management services. These ports represent the business logic interface.
- **Implement Adapters with Signal Store**: Use `signalStore` with `withState` and `withMethods` to create adapters that satisfy the port interfaces. Use the `satisfies` operator to ensure type compatibility without overriding inferred types.
- **Injection Utilities**: Provide convenient injection tokens and functions for dependency injection. Use `InjectionToken` and provider functions to inject adapters under ports.
- **Avoid Boilerplate**: Rely on type inference; do not explicitly define types unless necessary. Keep implementations lightweight and focused.
- **State Transformations**: Use `patchState` for updates, maintain pure and predictable transformations. Prefer `update` or `set` over `mutate` on signals.
- **Integration in Components**: Inject services using the provided utilities and use signals directly in components with `ChangeDetectionStrategy.OnPush`.

### Code Examples

#### Defining a Port Interface
```typescript
export interface FruitService {
  fruits: Signal<Fruit[]>;
  loadFruits(): void;
}
```

#### Implementing an Adapter with Signal Store
```typescript
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { Type } from '@angular/core';

const FruitServiceAdapter = signalStore(
  withState({ fruits: [] as Fruit[] }),
  withMethods((store) => ({
    loadFruits: async () => {
      const fruits = await fetch('https://api.example.com/fruits').then(res => res.json());
      patchState(store, { fruits });
    },
  }))
) satisfies Type<FruitService>;
```

#### Injection Utilities
```typescript
import { InjectionToken, Provider, inject } from '@angular/core';

const fruitServiceInjectionToken = new InjectionToken<FruitService>('fruits-service');

export function provideFruitService(): Provider {
  return {
    provide: fruitServiceInjectionToken,
    useClass: FruitServiceAdapter,
  };
}

export function injectFruitService(): FruitService {
  return inject(fruitServiceInjectionToken);
}
```

#### Usage in Components
```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  template: ``,
  providers: [provideFruitService()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private fruitService = injectFruitService();

  constructor() {
    this.fruitService.loadFruits();
  }
}
```

### Best Practices
- Combine with Hexagonal Architecture for clear boundaries between business logic and infrastructure.
- Ensure adapters fully implement ports using `satisfies` to maintain type inference benefits.
- Use standalone components and lazy loading for feature routes.
- Test adapters independently from components to leverage improved testability.
- Reference resources: [Angular Signals](https://angular.love/en/angular-signals-a-new-feature-in-angular-16), [Signal Store](https://angular.love/en/breakthrough-in-state-management-discover-the-simplicity-of-signal-store-part-1), [Hexagonal Architecture](https://angular.love/ports-and-adapters-vs-hexagonal-architecture-is-it-the-same-pattern).

### Final Thoughts
This approach combines NgRx Signal Store's simplicity with Hexagonal Architecture's modularity, providing a type-safe, maintainable state management solution. Implement with minimal code, focusing on separation of concerns and reactive paradigms.
````
