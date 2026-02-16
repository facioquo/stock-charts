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

## Acceptance Criteria

- [ ] Updated file:client/src/chartjs/financial/README.md with:
  - Installation instructions
  - Peer dependencies list
  - Quick start example (< 10 lines)
  - API reference (OverlayChart, OscillatorChart, ChartManager)
  - Theme configuration
- [ ] Created VitePress integration guide section with:
  - Static chart example (build-time rendering)
  - Interactive chart example (client-side rendering)
  - SSR handling example (onMounted hook)
  - Theme sync example (VitePress dark mode toggle)
  - Complete Vue component (copy-paste ready)
- [ ] Examples tested in actual VitePress environment (if available)
- [ ] Documentation reviewed for clarity

## Verification Steps

1. Read README.md - verify clarity and completeness
2. Copy static chart example - verify it's runnable
3. Copy interactive chart example - verify it's runnable
4. Verify SSR example shows proper guards
5. Verify theme sync example uses VitePress APIs correctly
6. Test examples in VitePress (if Stock.Indicators repo available)
7. Get feedback from potential library users
