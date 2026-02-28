# Plan: Reusable charts

Canonical tracker for the reusable charting library work originating from
[Issue #452](https://github.com/facioquo/stock-charts/issues/452)
and PR [#454](https://github.com/facioquo/stock-charts/pull/454)
("feat: Reusable charts") on the `reusable-charts` branch.

## Goal

Enable developers evaluating the
[Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators)
library to render interactive financial charts from any JavaScript framework
(Angular, VitePress/Vue, vanilla JS) by consuming the `@facioquo/indy-charts`
package as a single dependency.

## Architecture

### Library dependency chain

Consumers depend only on `@facioquo/indy-charts`. The internal dependency chain
is strictly:

```text
consumer (Angular, VitePress, etc.)
  └─ @facioquo/indy-charts          (chart abstractions, API client, config, data)
       └─ @facioquo/chartjs-chart-financial  (Chart.js candlestick/OHLC/volume plugin)
            └─ chart.js              (peer dependency)
```

**Consumers must never import `@facioquo/chartjs-chart-financial`, `chart.js`,
`chartjs-plugin-annotation`, or `chartjs-adapter-date-fns` directly.**
`@facioquo/indy-charts` re-exports and registers everything needed via
`setupIndyCharts()`.

### Library locations

| Package | Workspace path | Description |
| :--- | :--- | :--- |
| `@facioquo/chartjs-chart-financial` | `libs/chartjs-financial/` | Chart.js financial plugin (candlestick, OHLC, volume) |
| `@facioquo/indy-charts` | `libs/indy-charts/` | High-level chart API, config, data transformers, API client |

### Consumer locations

| Consumer | Workspace path | Notes |
| :--- | :--- | :--- |
| Angular website | `client/` | Primary showcase application |
| VitePress demo | `tests/vitepress/` | Integration test and documentation site |

## Current state

### Completed work (original Tasks 1-12)

The core library extraction and VitePress documentation are complete:

- **Smoke tests** — four tests in `client/src/app/services/chart.service.spec.ts`
  covering init, indicator lifecycle, theme switching, and dataset slicing
- **Config and data extraction** — pure functions in `libs/indy-charts/config/`
  and `libs/indy-charts/data/` (no Angular dependencies)
- **Chart abstractions** — `OverlayChart`, `OscillatorChart`, `ChartManager` in
  `libs/indy-charts/charts/`
- **API client** — `createApiClient()`, `getQuotes()`, `getListings()`,
  `getSelectionData()` in `libs/indy-charts/api/`
- **Static helpers** — `loadStaticQuotes()`, `loadStaticIndicatorData()` for
  build-time/demo scenarios
- **Build pipeline** — both libraries build via `tsc`, consumed via pnpm
  workspace linking
- **Partial Angular integration** — `client/` imports from
  `@facioquo/chartjs-chart-financial` for financial primitives but does not
  delegate to `ChartManager`
- **VitePress docs and demos** — installation guide, quick start, API client
  docs, live `IndyOverlayDemo` and `IndyIndicatorsDemo` Vue components
- **Playwright tests** — 11/11 VitePress content tests passing
- **PR #454 review fixes** — partial-update index bug, `ChartManager.settings`
  encapsulation, business-day padding in `addExtraBars()`, and other CodeRabbit
  feedback addressed

### Present problems

1. **Massive code duplication between client and library** — `chart.service.ts`
   (990 lines) and `config.service.ts` (398 lines) duplicate nearly all chart
   config, data transformation, dataset slicing, legend management, and theme
   switching that already exists in `@facioquo/indy-charts`. The client should
   delegate to `ChartManager` instead of reimplementing Chart.js logic.

2. **Client imports wrong packages** — `chart.service.ts` imports directly from
   `chart.js`, `chartjs-plugin-annotation`, and
   `@facioquo/chartjs-chart-financial`. Per architecture rules, it should only
   import from `@facioquo/indy-charts`.

3. **Duplicate type definitions** — `chart.models.ts` duplicates all interfaces
   from `libs/indy-charts/config/types.ts`. The client's `IndicatorSelection`
   has an Angular-specific `chart?: Chart` field that needs special handling.

4. **Manual Chart.js registration** — `main.ts` manually calls
   `registerFinancialCharts()` + `Chart.register(AnnotationPlugin)` instead of
   using `setupIndyCharts()`.

5. **Missing library helpers** — `defaultSelection()` and
   `selectionTokenReplacement()` are independently implemented in both the
   Angular client and VitePress demo utils. These belong in the library.

6. **Missing resize utility** — `calculateOptimalBars()` logic exists only in
   Angular's `WindowService`. External consumers need this too.

7. **Libraries not publishable** — both packages are `private: true` with
   `UNLICENSED`. External consumers can't install from a registry.

8. **`date-fns` peer dep version mismatch** — `@facioquo/indy-charts` declares
   `"date-fns": "^2.19.0"` but the workspace (and VitePress) uses `^4.1.0`.
   A Vite alias workaround exists in VitePress config, but this will break
   every external consumer.

9. **Minimal library test coverage** — `@facioquo/indy-charts` has only ESLint
   config and color utility tests. Core classes (`ChartManager`, `OverlayChart`,
   `OscillatorChart`, `createApiClient`) have zero unit tests.

## Task list

> Phases and tasks are prioritized based on logical implementation sequence
> and value. Earlier phases unblock later ones.

### Phase 1: Library API completeness

Make `@facioquo/indy-charts` a fully self-contained dependency so consumers
never need Chart.js imports.

- [x] Task 1.1: Move `defaultSelection()` into `@facioquo/indy-charts`
  - Extract from Angular `ChartService.defaultSelection()` and VitePress
    `indy-demo-utils.ts` → `createDefaultSelection()` in the library.
  - Given an `IndicatorListing`, produce an `IndicatorSelection` with default
    params and result placeholders. Accept optional param overrides.
  - Export from `libs/indy-charts/index.ts`.
  - Update both consumers (Angular, VitePress) to import from the library.

- [x] Task 1.2: Move `selectionTokenReplacement()` into `@facioquo/indy-charts`
  - Extract from Angular `ChartService.selectionTokenReplacement()` and
    VitePress `applySelectionTokens()` → `applySelectionTokens()` in the
    library.
  - Replace `[P1]`, `[P2]`, etc. in label and result labels with param values.
  - Export from `libs/indy-charts/index.ts`.
  - Update both consumers to import from the library.

- [x] Task 1.3: Add `calculateOptimalBars()` utility to library
  - Extract from Angular `WindowService.calculateOptimalBars()`.
  - Pure function: `(containerWidth: number, pixelsPerBar?: number) => number`.
  - Export from `libs/indy-charts/index.ts`.

- [x] Task 1.4: Fix `date-fns` peer dependency range
  - Update `@facioquo/indy-charts` peerDependencies to
    `"date-fns": ">=2.19.0"` (or `"^2.19.0 || ^3.0.0 || ^4.0.0"`) since only
    the adapter import is used internally.
  - Verify VitePress demo builds without the Vite alias workaround.
  - Remove the date-fns alias from `tests/vitepress/.vitepress/config.ts` if no
    longer needed.

### Phase 2: Angular client refactor

Rewrite the Angular client to delegate all Chart.js work to `ChartManager`,
removing ~1,000 lines of duplicated code.

- [ ] Task 2.1: Replace `main.ts` Chart.js registration with `setupIndyCharts()`
  - Remove manual `registerFinancialCharts()` and
    `Chart.register(AnnotationPlugin)` calls.
  - Call `setupIndyCharts()` once from `main.ts`.
  - Remove direct `chart.js` and `chartjs-plugin-annotation` imports from
    `main.ts`.

- [ ] Task 2.2: Delete `config.service.ts` — replace with library imports
  - All config builder functions (`baseOverlayConfig`, `baseOscillatorConfig`,
    `baseChartOptions`, `defaultXAxisOptions`, `baseDataset`,
    `commonLegendAnnotation`) already exist in `libs/indy-charts/config/`.
  - Remove `ChartConfigService` entirely.
  - Update `chart.service.spec.ts` and `config.service.spec.ts` accordingly.

- [ ] Task 2.3: Delete `chart.models.ts` — import types from library
  - All interfaces exist in `@facioquo/indy-charts`:
    `Quote`, `RawQuote`, `IndicatorDataRow`, `IndicatorListing`,
    `IndicatorParamConfig`, `IndicatorResultConfig`, `IndicatorSelection`,
    `IndicatorParam`, `IndicatorResult`, `ChartConfig`, `ChartThreshold`,
    `ChartFill`, `ChartSettings`.
  - The client-specific `UserSettings` interface (with extra UI fields) remains
    in an Angular service or a local types file.
  - The client's `IndicatorSelection.chart?: Chart` field does not belong in the
    library; use a separate `Map<string, Chart>` or rely on
    `ChartManager.oscillators` for oscillator references.
  - Update all client imports.

- [ ] Task 2.4: Rewrite `chart.service.ts` to delegate to `ChartManager`
  - Replace ~990 lines with ~200-300 lines that:
    - Instantiate `ChartManager` with current `ChartSettings`.
    - Delegate `loadCharts()` → `ChartManager.initializeOverlay()`.
    - Delegate `addSelection()` → `ChartManager.processSelectionData()` +
      `displaySelection()` + `createOscillator()`.
    - Delegate `deleteSelection()` → `ChartManager.removeSelection()` + DOM
      cleanup for oscillator containers.
    - Delegate `onSettingsChange()` → `ChartManager.updateTheme()`.
    - Delegate `onWindowResize()` → `ChartManager.setBarCount()` (using
      `calculateOptimalBars()` from library).
    - Keep Angular-specific concerns: `HttpClient`-based `ApiService` usage
      (RxJS), `localStorage` caching, oscillator DOM container management,
      dialog/scroll integration, default selection hydration.
  - Remove all direct `chart.js`, `chartjs-plugin-annotation`, and
    `@facioquo/chartjs-chart-financial` imports.
  - The only chart-related import should be `@facioquo/indy-charts`.

- [ ] Task 2.5: Remove `@facioquo/chartjs-chart-financial` as direct client dependency
  - Remove from `client/package.json` — it's a transitive dependency of
    `@facioquo/indy-charts`.
  - Remove from `client/tsconfig.json` path mappings if present.
  - Verify the Angular build still compiles and all tests pass.

- [ ] Task 2.6: Update smoke tests for new architecture
  - Update `chart.service.spec.ts` to test the `ChartManager`-delegating service.
  - Verify the four existing smoke tests still cover: init, indicator lifecycle,
    theme switching, dataset slicing.
  - Add test for `defaultSelection()` from library.

### Phase 3: Library quality and testing

Establish confidence for external consumers.

- [ ] Task 3.1: Add unit tests for `ChartManager`
  - Test `initializeOverlay()` with mocked canvas context.
  - Test `processSelectionData()` → `displaySelection()` lifecycle.
  - Test `removeSelection()` cleanup.
  - Test `setBarCount()` slicing correctness.
  - Test `updateTheme()` propagation.
  - Target 60% coverage for `charts/` module.

- [ ] Task 3.2: Add unit tests for `createApiClient`
  - Test `getQuotes()` with mocked fetch, verify Date objects returned.
  - Test `getListings()` with mocked fetch.
  - Test `getSelectionData()` query string construction.
  - Test `onError` callback invocation.
  - Target 50% coverage for `api/` module.

- [ ] Task 3.3: Add unit tests for data transformers
  - Test `processQuoteData()` output shape and volumeAxisSize calculation.
  - Test `buildDataPoints()` with various indicator types.
  - Test `addExtraBars()` business-day padding.
  - Test `getCandlePointConfiguration()` for match values (-100, 100, other).
  - Target 70% coverage for `data/` module.

- [ ] Task 3.4: Add unit tests for `createDefaultSelection()` and `applySelectionTokens()`
  - Test default param hydration from listing.
  - Test token replacement in labels.
  - Test with missing/optional params.

### Phase 4: Publishing and external consumption

Prepare libraries for consumption outside this workspace.

- [ ] Task 4.1: Choose license and update package metadata
  - Replace `UNLICENSED` with chosen open-source license in both library
    `package.json` files.
  - Update `author`, `repository`, `homepage`, and `bugs` fields.

- [ ] Task 4.2: Remove `private: true` and set version for publishing
  - Decide on initial version (likely `0.1.0` or `1.0.0`).
  - Remove `"private": true` from both library `package.json` files.
  - Verify `pnpm pack` produces correct tarballs with only `dist/` and metadata.

- [ ] Task 4.3: Configure GitHub Packages publishing
  - Add `.npmrc` configuration for `@facioquo` scope → GitHub Packages.
  - Add or update GitHub Actions workflow to publish on release/tag.
  - Verify consumers can install from the private registry with appropriate
    authentication.

- [ ] Task 4.4: Validate external consumption
  - Test installation in a fresh VitePress project outside this workspace.
  - Verify `setupIndyCharts()` → `createApiClient()` → `OverlayChart` works
    end-to-end.
  - Verify peer dependencies resolve correctly.
  - Document any `.npmrc` or authentication setup needed for consumers.

## Deferred / future work

These items are intentionally out of scope for the current plan:

- **LocalStorage caching** — `ChartManager.enableCaching(key)` and
  `restoreState()` (originally planned as Task 4). Create a new task if needed.
- **Full `ChartManager` integration in VitePress demo** — the demo works but
  could be richer (window resize, dynamic indicator add/remove).
- **Higher-level oscillator container helper** — utility for dynamically
  creating oscillator canvas containers (currently consumer responsibility).
- **Error/fallback data strategy in library** — `createApiClient()` has
  `onError` callback but no built-in fallback. Angular client implements its own
  fallback via backup JSON. Consider adding optional fallback to library.

## Reference: library public API surface

### Setup

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

### API client

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://your-api.com",
  onError: (context, error) => console.error(context, error)
});

const quotes = await client.getQuotes();
const listings = await client.getListings();
const rows = await client.getSelectionData(selection, listing);
```

### Chart abstractions

```typescript
import { ChartManager, OverlayChart } from "@facioquo/indy-charts";

// Simple overlay
const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true
});
chart.render(quotes);

// Full manager with indicators
const manager = new ChartManager({
  settings: { isDarkTheme: false, showTooltips: true }
});
manager.initializeOverlay(canvas, quotes, 250);
manager.processSelectionData(selection, listing, indicatorRows);
manager.displaySelection(selection, listing);
manager.createOscillator(oscillatorCanvas, selection, listing);
```

### Static helpers

```typescript
import {
  loadStaticQuotes,
  loadStaticIndicatorData
} from "@facioquo/indy-charts";

const quotes = loadStaticQuotes(rawQuoteArray);
const rows = loadStaticIndicatorData(rawIndicatorArray);
```

### Selection helpers (to be added in Phase 1)

```typescript
import {
  createDefaultSelection,
  applySelectionTokens,
  calculateOptimalBars
} from "@facioquo/indy-charts";

const selection = createDefaultSelection(listing, { lookbackPeriods: 20 });
const labeled = applySelectionTokens(selection);
const barCount = calculateOptimalBars(window.innerWidth);
```
