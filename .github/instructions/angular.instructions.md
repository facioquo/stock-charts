---
applyTo: "client/**/*.{ts,html,scss,json}"
description: "Project-specific Angular development guidelines"
---

## Angular development guidelines

**CRITICAL**: Always use `#mcp_angular-cli_get_best_practices` and `#mcp_angular-cli_search_documentation` for official Angular best practices. Do NOT duplicate official guidance here.

## Code quality - Non-negotiable rules

### Linting and type safety

**NEVER suppress ESLint or TypeScript errors/warnings without explicit approval.** This includes:

- ❌ **FORBIDDEN**: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- ❌ **FORBIDDEN**: `// @ts-ignore` or `// @ts-expect-error`
- ❌ **FORBIDDEN**: Using `any` type except in very specific, documented cases
- ❌ **FORBIDDEN**: Disabling strict TypeScript checks
- ❌ **FORBIDDEN**: Using `// eslint-disable` for any rule without team review

**When you encounter linting errors:**

1. Fix the underlying issue properly
2. Refactor code to meet type safety requirements
3. Use proper TypeScript types and Angular patterns
4. Consult `#mcp_angular-cli_get_best_practices` for guidance
5. Only suppress as absolute last resort with detailed justification

### Code Quality Standards

- All code must pass ESLint without suppressions
- Maintain 100% TypeScript type safety
- Use `unknown` instead of `any` when type is uncertain
- Write self-documenting code that expresses intent clearly

### Component structure requirements

**Do not inline component HTML or SCSS** (template or styles properties with large multiline strings) in production/source code. Always use external `*.html` and `*.scss` (or `*.css`) files referenced via `templateUrl` and `styleUrls` to:

- Enable proper editor language tooling (HTML/SCSS intellisense, formatting, diagnostics)
- Improve readability and separation of concerns
- Simplify diff reviews and reduce noisy changes when editing markup or styles
- Allow focused unit testing and potential future template pre-processing

Permitted exceptions (must be justified in a code comment directly above the `@Component`):

- Tiny presentational components whose template is a single, short line (≤ 80 chars, no structural directives)
- Temporary experimental spike code (must be removed before merge to main)

If a test environment has issues resolving external resources, adjust the test (e.g., override component or use Angular testing utilities) rather than inlining the production component. Do not commit inline templates/styles to solve test configuration problems.

## Stock Charts Project-Specific Guidelines

### Chart.js Integration

- Use Chart.js v4+ with Angular integration via direct canvas manipulation
- Implement proper cleanup in component `ngOnDestroy()` to prevent memory leaks
- Use Angular's `ViewChild` to access canvas elements safely
- Handle chart resizing through Angular's `resize` service or window resize listeners

### Financial Data Architecture

#### API Service Patterns

- Implement failover pattern for multiple stock data APIs with proper error handling
- Use Angular HTTP interceptors for retry logic and error standardization
- Cache stock quote data appropriately using Angular's HTTP cache
- Handle real-time updates with WebSocket services when available

#### Component Structure

- **Chart components**: Keep chart rendering logic separate from data fetching
- **Configuration components**: Use reactive forms for chart settings and indicators
- **Data services**: Abstract stock data APIs behind service interfaces
- **Utility services**: Financial calculations should be pure functions in services

#### Performance for Financial Applications

- Use `OnPush` change detection for chart components (data-driven updates)
- Implement virtual scrolling for large historical datasets
- Optimize chart redraws by comparing data changes with signals
- Use trackBy functions for large lists of financial instruments

### Testing Financial Components

- Mock stock data APIs in unit tests with realistic data shapes
- Test chart responsiveness and resize behavior across screen sizes
- Verify financial calculations accuracy in isolated unit tests
- Test error handling for API failures and data inconsistencies
- Use Angular Material Component Harnesses for Material component testing

### Development Workflow

- Use provided VS Code tasks for consistent formatting and linting
- Run `npm run format` before commits to maintain code consistency
- Test chart components across different screen sizes and orientations
- **Never commit code with linting errors or warnings**

### Angular Material Integration

- Use [Angular Material](https://material.angular.dev/guide/) for UI components and theming
- Import only required Material modules for optimal bundle size
- Use [Component Harnesses](https://material.angular.dev/guide/using-component-harnesses) for testing Material components
- Follow Material Design guidelines for consistent UX

## Quick Reference - Official Sources

**Always consult these for up-to-date guidance:**

- `#mcp_angular-cli_get_best_practices` - Latest official Angular best practices
- `#mcp_angular-cli_search_documentation` - Search Angular.dev documentation
- [Angular.dev](https://angular.dev/) - Official documentation
- [Angular Material](https://material.angular.dev/) - Material components and theming
- [Chart.js Documentation](https://www.chartjs.org/docs) - Chart.js integration guidance

---

**Remember**: This file contains only project-specific preferences. For all official Angular guidance, patterns, and best practices, use the MCP server tools above.
