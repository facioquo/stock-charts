---
applyTo: "client/**/*.{ts,html,scss,md}, angular.json"
description: "Guidelines for developing Angular websites"
---

## Angular development guidelines

Follow these rules to ensure high-quality, maintainable, and modern Angular code using the latest official best practices from [Angular Guidelines](https://angular.dev/assets/context/guidelines.md) and [Angular Best Practices](https://angular.dev/assets/context/best-practices.md):

### Core principles (Official Angular Guidelines)

- **Use the latest Angular version**: Always upgrade to the newest stable Angular release (Angular v20+). Review [Angular Update Guide](https://update.angular.dev/) before upgrading.

- **Standalone components first**: Always use standalone components over NgModules. Don't use explicit `standalone: true` (it is implied by default in modern Angular).

- **Signals and modern reactivity**: Use Angular Signals for state management and reactive patterns. Embrace the new reactive primitives for better performance and developer experience.

- **Modern control flow**: Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch` directives.

- **TypeScript strict mode**: Use strict type checking everywhere. Prefer type inference when the type is obvious. Avoid the `any` type; use `unknown` when type is uncertain.

### Components (Official Best Practices)

- **Single responsibility**: Keep components small and focused on a single responsibility.

- **Modern input/output**: Use `input()` and `output()` functions instead of decorators. Learn more at [Angular Inputs](https://angular.dev/guide/components/inputs) and [Angular Outputs](https://angular.dev/guide/components/outputs).

- **Signal-based state**: Use `computed()` for derived state. Learn more about signals at [Angular Signals Guide](https://angular.dev/guide/signals).

- **OnPush change detection**: Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator for optimal performance.

- **Template preferences**: Prefer inline templates for small components. Keep templates simple and avoid complex logic.

- **Forms**: Prefer Reactive forms instead of Template-driven ones.

- **Class and style bindings**: Do NOT use `ngClass`, use `class` bindings instead. Do NOT use `ngStyle`, use `style` bindings instead. See [CSS binding documentation](https://angular.dev/guide/templates/binding#css-class-and-style-property-bindings).

### Architecture and structure

- **Feature-based organization**: Organize code by feature modules with clear boundaries. Use a consistent folder structure: `components/`, `pages/`, `services/`, `models/`, etc.

- **Smart vs presentational components**: Separate smart (container) components that handle data and logic from presentational components that focus on UI rendering.

- **Dependency injection**: Use the `inject()` function instead of constructor injection. Use Angular's DI system for all services and shared logic. Prefer `providedIn: 'root'` for singleton services.

- **Routing best practices**: Use the Angular Router with lazy loading for feature modules/pages. Define routes in a dedicated `app.routes.ts` file. Implement lazy loading for feature routes.

### Performance and optimization

- **Change detection strategy**: Use `ChangeDetectionStrategy.OnPush` for all components unless necessary otherwise. This improves performance significantly.

- **Lazy loading**: Implement lazy loading for routes and features. Use dynamic imports and route-based code splitting.

- **TrackBy functions**: Always use trackBy functions in `@for` loops when dealing with dynamic lists to optimize rendering performance.

- **Optimized images**: Use `NgOptimizedImage` for all static images to improve loading performance.

### State Management (Official Guidelines)

- **Local component state**: Use signals for local component state management.

- **Derived state**: Use `computed()` for derived state calculations.

- **Pure transformations**: Keep state transformations pure and predictable.

### Templates (Official Best Practices)

- **Control flow**: Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives (`*ngIf`, `*ngFor`, `*ngSwitch`).

- **Async pipe**: Use the async pipe to handle observables in templates.

- **Pipes**: Use built-in pipes and import pipes when being used in a template. Learn more at [Angular Pipes Guide](https://angular.dev/guide/templates/pipes).

- **Simple templates**: Keep templates simple and avoid complex logic.

### Services (Official Guidelines)

- **Single responsibility**: Design services around a single responsibility principle.

- **Singleton services**: Use the `providedIn: 'root'` option for singleton services.

- **Modern injection**: Use the `inject()` function instead of constructor injection.

### Styling and theming

- **Component-scoped styles**: Use SCSS for styles with component view encapsulation. Scope styles to components to avoid global conflicts.

- **CSS custom properties**: Prefer CSS custom properties (variables) for theming and dynamic styling over SCSS variables.

- **Angular Material integration**: Use [Angular Material](https://material.angular.dev/guide/) for UI components and theming. Prefer Material components for consistency, accessibility, and responsiveness. Customize themes using SCSS and follow Material Design guidelines. Import only required Material modules for optimal bundle size. Use [schematics](https://material.angular.dev/guide/schematics#dashboard-schematic) to generate features where needed.

### Testing and quality

- **Comprehensive testing**: Write unit tests for all components, services, and utilities using Jest or Angular's default test runner. Aim for high coverage (80%+ as per project standards).

- **Testing best practices**: Test behavior, not implementation. Use Angular Testing Utilities and avoid testing private methods or implementation details.

- **Angular Material Component Harnesses**: When testing Angular Material components, use the official [Angular Material Component Harnesses](https://material.angular.dev/guide/using-component-harnesses) instead of querying DOM elements directly. This approach creates more stable, maintainable tests that don't break when internal component structure changes.

  **Component Harnesses Benefits:**
  - Tests interact with components the same way users do
  - Tests are less brittle and don't rely on internal DOM structure  
  - Harnesses provide a stable API that won't change between Material versions
  - Tests are more readable and express user intent clearly

  **Example using MatTreeHarness:**

  ```typescript
  import { HarnessLoader } from '@angular/cdk/testing';
  import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
  import { MatTreeHarness } from '@angular/material/tree/testing';

  let loader: HarnessLoader;

  beforeEach(() => {
    // Setup TestBed...
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should expand tree nodes', async () => {
    const tree = await loader.getHarness(MatTreeHarness);
    const nodes = await tree.getNodes({ expanded: false });
    
    if (nodes.length > 0) {
      await nodes[0].expand();
      expect(await nodes[0].isExpanded()).toBe(true);
    }
  });
  ```

  **Available Harnesses**: Most Angular Material components have corresponding harnesses (MatButtonHarness, MatInputHarness, MatSelectHarness, MatTreeHarness, etc.). Import them from `@angular/material/[component]/testing`.

- **Linting and formatting**: Use ESLint with Angular plugin and Angular-specific rules. Enforce formatting with Prettier. Run `npm run lint` and `npm run format` before commits.

### Accessibility and UX

- **Accessibility first**: Follow [Angular accessibility guidelines](https://angular.dev/guide/accessibility). Use semantic HTML, ARIA attributes, and ensure keyboard navigation works properly.

- **Progressive enhancement**: Build applications that work without JavaScript and enhance with Angular features.

- **Responsive design**: Ensure applications work across all device sizes and orientations.

### Documentation and maintenance

- **API documentation**: Document all public APIs and complex logic with JSDoc comments. Keep README.md files up to date in each directory.

- **Code comments**: Write clear, concise comments that explain why something is done, not what is done (the code should be self-explanatory).

### Security best practices

- **Angular's built-in security**: Never bypass Angular's built-in sanitization. Use Angular's security features like the DomSanitizer when necessary.

- **Type safety**: Avoid `any` types and direct DOM manipulation. Use proper TypeScript types and Angular's APIs.

- **Input validation**: Always validate and sanitize user inputs, both on client and server side.

## Modern Angular examples (Official Guidelines)

### Component with signals and modern control flow

**TypeScript component (Angular v20+):**

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-server-status',
  templateUrl: './server-status.component.html',
  styleUrls: ['./server-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerStatusComponent {
  protected readonly isServerRunning = signal(true);
  
  toggleServerStatus() {
    this.isServerRunning.update(isServerRunning => !isServerRunning);
  }
}
```

**Template with modern control flow:**

```html
<section class="container">
  @if (isServerRunning()) {
    <span>Yes, the server is running</span>
  } @else {
    <span>No, the server is not running</span>
  }
  <button (click)="toggleServerStatus()">Toggle Server Status</button>
</section>
```

**Component styles:**

```scss
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;

  button {
    margin-top: 10px;
  }
}
```

### Key patterns to follow

- Use `signal()` for reactive state
- Use `@if`, `@for`, `@switch` instead of structural directives
- Set `ChangeDetectionStrategy.OnPush` for performance
- Use `input()` and `output()` functions for component communication
- Use `computed()` for derived state
- Use `inject()` function for dependency injection

### Essential resources

- [Components](https://angular.dev/essentials/components)
- [Signals](https://angular.dev/essentials/signals)
- [Templates](https://angular.dev/essentials/templates)
- [Dependency Injection](https://angular.dev/essentials/dependency-injection)

## Angular references

### Official guidelines and best practices

- [Angular Guidelines](https://angular.dev/assets/context/guidelines.md) - Official development guidelines
- [Angular Best Practices](https://angular.dev/assets/context/best-practices.md) - Official best practices
- [Language Style Guide](https://angular.dev/style-guide) - Official coding style guide
- [Language Reference API](https://angular.dev/api)

### Language

- [Language documentation](https://angular.dev/)
- [GitHub repository](https://github.com/angular/angular)

### Material design and web components

- [Material documentation](https://material.angular.dev/)
- [GitHub repository](https://github.com/angular/components)
- [Components](https://material.angular.dev/components)
- [Component Dev Kit (CDK)](https://material.angular.dev/cdk)
- [Components (extensions)](https://ng-matero.github.io/extensions/components)
- [Theming guide](https://material.angular.dev/guide/theming)
- [Guides](https://material.angular.dev/guides) (general)
- [Material Design (style)](https://material.io/styles)

### `ng` CLI

- [CLI command reference](https://angular.dev/cli)
- [GitHub repository](https://github.com/angular/angular-cli)

---
Last updated: July 1, 2025
