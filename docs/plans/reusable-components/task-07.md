# Task 7: Create VitePress Integration Documentation and Examples

## Scope & Objective

Document library usage for VitePress with complete examples for both static (build-time) and interactive (client-side) chart rendering.

**In scope**:

- Update file:client/src/chartjs/financial/README.md with installation and API docs
- Create VitePress integration guide with Vue component examples
- Document SSR handling (client-side only rendering)
- Document static data loading pattern
- Document theme synchronization with VitePress dark mode
- Provide copy-paste ready examples

**Out of scope**:

- Actual VitePress site implementation (in DaveSkender/Stock.Indicators repo)
- Advanced customization examples
- API reference documentation (can be added later)

## References

**From Approach** (spec: [Chart System Extraction (approach)](02-approach.md)):

- Section 1: Design Decisions - "VitePress needs both static and interactive examples"
- Section 3: Component Architecture - API interfaces and usage patterns

## Guardrails

**Documentation must show**:

- Installation: `npm install @stock-charts/financial chart.js`
- Basic usage (5-10 lines of code)
- Static data example (import JSON, pass to chart)
- Interactive example (fetch from API)
- Theme synchronization (VitePress useData composable)
- SSR handling (onMounted or ClientOnly component)

**Examples must be**:

- Copy-paste ready (complete, runnable code)
- TypeScript (with proper types)
- Vue 3 composition API (VitePress standard)
- Minimal (focus on chart, not boilerplate)

## Status: Complete (fulfilled via Task 12)

All VitePress documentation and integration examples were completed as part of
Task 12. See [task-12.md](task-12.md) for the full list of deliverables.

## Acceptance Criteria

- [x] `libs/indy-charts/README.md` updated with correct APIs (`createApiClient()`,
      `setupIndyCharts()`, `OverlayChart`, `ChartManager`, `loadStaticQuotes()`)
- [x] `libs/chartjs-financial/README.md` documents financial chart types
- [x] VitePress integration guide (`tests/vitepress/guide/`) with:
  - [x] `quick-start.md` — correct `setupIndyCharts()` / `OverlayChart` usage
  - [x] `api-client.md` — `createApiClient()` with `getQuotes()`, `getListings()`,
        `getSelectionData()`
  - [x] SSR-safe examples using `onMounted` / `<ClientOnly>` patterns
  - [x] Theme sync via VitePress `useData().isDark`
- [x] `tests/vitepress/examples/` with live demo components
      (`IndyOverlayDemo.vue`, `IndyIndicatorsDemo.vue`)
- [x] Examples tested in VitePress environment (Playwright, 11/11 passing)

## Verification Steps

1. Read README.md - verify clarity and completeness
2. Copy static chart example - verify it's runnable
3. Copy interactive chart example - verify it's runnable
4. Verify SSR example shows proper guards
5. Verify theme sync example uses VitePress APIs correctly
6. Test examples in VitePress (if Stock.Indicators repo available)
7. Get feedback from potential library users
