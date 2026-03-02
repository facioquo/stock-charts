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
- **Playwright tests** — 12/12 VitePress content tests + 6/6 Angular website
  tests passing (18 total)
- **PR #454 review fixes** — partial-update index bug, `ChartManager.settings`
  encapsulation, business-day padding in `addExtraBars()`, and other CodeRabbit
  feedback addressed

### Present problems

1. ~~**Massive code duplication between client and library**~~ — **RESOLVED
   (Task 2.4).** `chart.service.ts` rewritten from 948→~280 lines. Delegates
   to `ChartManager` for all Chart.js work. `config.service.ts` deleted
   (Task 2.2). Net reduction: ~1,060 lines of duplicated chart logic removed.

2. ~~**Client imports wrong packages**~~ — **RESOLVED (Task 2.4).** The only
   chart-related import in `chart.service.ts` is `@facioquo/indy-charts`.
   All `chart.js`, `chartjs-plugin-annotation`, and
   `@facioquo/chartjs-chart-financial` imports removed.

3. ~~**Duplicate type definitions**~~ — **RESOLVED (Task 2.3).** Deleted
   `chart.models.ts`. All types imported from `@facioquo/indy-charts`.
   `ClientIndicatorSelection` in `client/src/app/types/chart.types.ts` extends
   the library's `IndicatorSelection` with the Angular-specific `chart?: Chart`
   field. `UserSettings` re-exported as alias for `ChartSettings`.

4. ~~**Manual Chart.js registration**~~ — **RESOLVED (Task 2.1).** `main.ts`
   now calls `setupIndyCharts()` instead of manual registration.

5. ~~**Missing library helpers**~~ — **RESOLVED (Phase 1).** `createDefaultSelection()`,
   `applySelectionTokens()`, and `calculateOptimalBars()` are now exported from
   `@facioquo/indy-charts`. Both consumers (Angular, VitePress) import from the
   library.

6. ~~**Missing resize utility**~~ — **RESOLVED (Phase 1).** `calculateOptimalBars()`
   exported from `@facioquo/indy-charts/helpers`.

7. ~~**Libraries not publishable**~~ — **RESOLVED (Phase 4).** Both packages
   are Apache-2.0 licensed, `private: true` removed, `publishConfig` targets
   GitHub Packages (`https://npm.pkg.github.com`), and a
   `publish-packages.yml` workflow handles release-triggered publishing.

8. ~~**`date-fns` peer dep version mismatch**~~ — **RESOLVED (Phase 1).** Updated
   to `"date-fns": ">=2.19.0"`. VitePress date-fns alias still needed because
   `chartjs-adapter-date-fns@3.0.0` itself declares `date-fns@^2` as peer.

9. ~~**Minimal library test coverage**~~ — **RESOLVED (Phase 3).** 118
   library tests across 9 spec files: ChartManager (31), createApiClient (21),
   static helpers (7), data transformers (28), selection helpers (25),
   colors (2), ESLint config (4).

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

- [x] Task 2.1: Replace `main.ts` Chart.js registration with `setupIndyCharts()`
  - Remove manual `registerFinancialCharts()` and
    `Chart.register(AnnotationPlugin)` calls.
  - Call `setupIndyCharts()` once from `main.ts`.
  - Remove direct `chart.js` and `chartjs-plugin-annotation` imports from
    `main.ts`.

- [x] Task 2.2: Delete `config.service.ts` — replace with library imports
  - All config builder functions (`baseOverlayConfig`, `baseOscillatorConfig`,
    `baseChartOptions`, `defaultXAxisOptions`, `baseDataset`,
    `commonLegendAnnotation`) now exported from `@facioquo/indy-charts`.
  - Removed `ChartConfigService` entirely; `chart.service.ts` imports library
    functions directly and threads `ChartSettings` via a private getter.
  - Updated `chart.service.spec.ts`: removed mock config service, uses real
    library functions; test 3 (theme switching) rewritten to test config
    functions directly since Chart.js proxy resolution fails in JSDOM.
  - Deleted `config.service.ts` (398 lines) and `config.service.spec.ts`.

- [x] Task 2.3: Delete `chart.models.ts` — import types from library
  - Created `client/src/app/types/chart.types.ts` with
    `ClientIndicatorSelection extends IndicatorSelection` (adds `chart?: Chart`)
    and `UserSettings` re-exported as alias for `ChartSettings`.
  - Added `ExtendedChartDataset` to library exports.
  - Updated 9 client files to import types from `@facioquo/indy-charts`.
  - Deleted `chart.models.ts`.

- [x] Task 2.4: Rewrite `chart.service.ts` to delegate to `ChartManager`
  - Rewrote from 948→~280 lines. Service now delegates to `ChartManager`:
    - `loadCharts()` → `ChartManager.initializeOverlay(ctx, quotes, barCount)`
    - `addSelection()` → `processSelectionData()` + `displaySelection()` +
      `createOscillator()` (with Angular DOM container management)
    - `deleteSelection()` → `ChartManager.removeSelection()` + DOM cleanup
    - `onSettingsChange()` → `ChartManager.updateTheme(settings)`
    - `onWindowResize()` → `ChartManager.setBarCount()` + `resize()`
  - Kept Angular concerns: `ApiService` (RxJS), `localStorage` caching,
    oscillator DOM container management, dialog/scroll, loading signal.
  - Removed `ClientIndicatorSelection` from `chart.types.ts` — `ChartManager`
    tracks oscillator chart references internally.
  - Only chart import: `@facioquo/indy-charts`.
  - Rewrote `chart.service.spec.ts`: 4 smoke tests covering init, indicator
    lifecycle, theme switching, and dataset slicing.

- [x] Task 2.5: Remove `@facioquo/chartjs-chart-financial` as direct client dependency
  - Removed from `client/package.json`. It's a transitive dependency of
    `@facioquo/indy-charts` (regular dep, not peer).
  - Kept `tsconfig.json` path mapping — Angular's bundler resolves indy-charts
    to source, which imports chartjs-chart-financial; the path mapping is needed
    for TypeScript compilation.
  - Kept `chart.js`, `chartjs-plugin-annotation`, `chartjs-adapter-date-fns`,
    and `date-fns` in `package.json` — they are peer deps of indy-charts and
    pnpm requires consumers to install peers explicitly.
  - Build, lint, and 76 tests all pass.

- [x] Task 2.6: Update smoke tests for new architecture
  - Verified the 4 existing smoke tests cover the ChartManager-delegating
    architecture: init, indicator lifecycle, theme switching, dataset slicing.
  - `defaultSelection()` already tested via library (Task 3.4, 8 tests) and
    exercised in client Test 2's indicator lifecycle flow.
  - Deleted dead `chart-test-harness.ts` (206 lines) — referenced obsolete
    `allQuotes` and `indicatorListings` APIs, was never imported.
  - 76 client tests pass.

### Phase 3: Library quality and testing

Establish confidence for external consumers.

- [x] Task 3.1: Add unit tests for `ChartManager`
  - 31 tests in `charts/chart-manager.spec.ts` covering: constructor (4),
    initializeOverlay (4), processSelectionData (2), displaySelection (3),
    createOscillator (3), removeSelection (3), updateTheme (3),
    setBarCount (7), destroy (2).
  - Mocks `OverlayChart`/`OscillatorChart` via `vi.mock` for DOM-free testing.
  - Added ESLint spec relaxations: `no-unsafe-assignment`, `no-unsafe-call`,
    `no-unsafe-member-access`, `unbound-method` (standard for test files with
    mocking).
  - 62 total library tests passing.

- [x] Task 3.2: Add unit tests for `createApiClient` and static helpers
  - 21 tests in `api/client.spec.ts`: baseUrl normalisation (2), getQuotes (6),
    getListings (4), getSelectionData (7), onError callback behaviour (2).
    Mocks global `fetch` via `vi.stubGlobal` for DOM-free testing.
  - 7 tests in `api/static.spec.ts`: loadStaticQuotes date conversion (4),
    loadStaticIndicatorData pass-through (3).
  - 90 total library tests passing.

- [x] Task 3.3: Add unit tests for data transformers
  - 28 tests in `data/transformers.spec.ts`: processQuoteData (6),
    buildDataPoints (9 — including candlestick-pattern category tests),
    addExtraBars (7 — weekend skipping, empty array fallback, monotonic
    timestamps), getCandlePointConfiguration (6 — bearish/bullish/neutral
    match values and multiplier correctness).
  - 118 total library tests passing.

- [x] Task 3.4: Add unit tests for `createDefaultSelection()` and `applySelectionTokens()`
  - Test default param hydration from listing.
  - Test token replacement in labels.
  - Test with missing/optional params.
  - 25 tests across 3 spec files (8 + 7 + 10) covering helpers.

### Phase 4: Publishing and external consumption

Prepare libraries for consumption outside this workspace.

- [x] Task 4.1: Choose license and update package metadata
  - Set `"license": "Apache-2.0"` in both library `package.json` files
    (matches the root project license).
  - Added `repository` (with `directory` field), `homepage`, and `bugs` fields
    pointing to `github.com/facioquo/stock-charts`.
  - Removed `"private": true` from both packages.

- [x] Task 4.2: Remove `private: true` and set version for publishing
  - Version kept at `0.1.0` (pre-1.0 signals early/experimental stage).
  - Added `"publishConfig": { "registry": "https://npm.pkg.github.com" }` to
    both packages to target GitHub Packages.
  - Validated `pnpm pack --dry-run` produces clean tarballs: only `dist/`,
    `README.md`, `NOTICE` (chartjs-financial), and `package.json`. Stale
    `dist/eslint.config.*` files cleaned by rebuilding after `rm -rf dist/`.

- [x] Task 4.3: Configure GitHub Packages publishing
  - Created root `.npmrc` with `@facioquo:registry=https://npm.pkg.github.com`.
  - Created `.github/workflows/publish-packages.yml` workflow triggered on
    GitHub Release events. Builds both libraries, runs tests, then publishes
    with `--access restricted` using `GITHUB_TOKEN`.
  - Publish order: chartjs-chart-financial first (dependency of indy-charts).

- [ ] Task 4.4: Validate external consumption
  - The full validation workflow is covered by Phase 5 below.
  - Smoke-test locally: `pnpm pack` both libraries, install tarballs in an
    isolated `package.json`, import `setupIndyCharts`, confirm no missing
    peer dep errors.
  - Verify `pnpm pack --dry-run` tarball contents include only `dist/`,
    `README.md`, `NOTICE` (chartjs-financial only), and `package.json`.

### Phase 5: External VitePress documentation site integration

Integrate `@facioquo/indy-charts` into the external VitePress documentation
site hosted in a separate GitHub repository, consuming the **published** packages
from GitHub Packages and calling the **deployed** API endpoint
`https://stock-charts-api.azurewebsites.net`.

Prerequisites: Phase 4 tasks 4.1–4.3 complete; packages must be published to
GitHub Packages before the external repo can install them.

- [ ] Task 5.1: Publish v0.1.0 packages to GitHub Packages
  - Create a GitHub Release tagged `v0.1.0` in the `facioquo/stock-charts`
    repository. The `publish-packages.yml` workflow fires automatically.
  - Confirm both `@facioquo/chartjs-chart-financial` and
    `@facioquo/indy-charts` appear under the repository Packages page
    with the `latest` dist-tag.
  - This is a one-time gate; subsequent upgrades follow the same release
    trigger with a new semver tag.

- [ ] Task 5.2: Configure the external repository for GitHub Packages authentication
  - Create `.npmrc` at the repo root:

    ```text
    @facioquo:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
    ```

  - Add `NODE_AUTH_TOKEN` as a repository secret set to a classic PAT
    (`read:packages` scope) or `GITHUB_TOKEN` if the external repo is in
    the same GitHub org that owns the packages.
  - For local development, set `NODE_AUTH_TOKEN` via `.env` or shell
    profile (never commit a literal token).

- [ ] Task 5.3: Install `@facioquo/indy-charts` and peer dependencies
  - Run `pnpm add @facioquo/indy-charts` — installs the published package
    plus its transitive dependency `@facioquo/chartjs-chart-financial`.
  - Install peer dependencies explicitly (pnpm requires it):
    `pnpm add chart.js chartjs-plugin-annotation chartjs-adapter-date-fns date-fns`
  - Do **not** add `@facioquo/chartjs-chart-financial` as a direct dependency;
    it is a transitive dep of `@facioquo/indy-charts`.

- [ ] Task 5.4: Configure VitePress `config.ts` for published package consumption
  - Unlike `tests/vitepress`, the external site must **not** use workspace
    path aliases that resolve to TypeScript source.
  - Add `ssr.noExternal` for Chart.js family packages to prevent SSR
    externalisation failures:

    ```typescript
    ssr: {
      noExternal: ["chartjs-adapter-date-fns", "chart.js", "date-fns"]
    }
    ```

  - Add a `date-fns` alias pinning the version installed in the site's own
    `node_modules` (see `tests/vitepress/.vitepress/config.ts` for the
    reference implementation — the `chartjs-adapter-date-fns@3.0.0` peer
    dep mismatch still applies).
  - Call `setupIndyCharts()` exactly once in `.vitepress/theme/index.ts`
    inside the `enhanceApp` hook.

- [ ] Task 5.5: Port demo Vue components with the deployed API URL as default
  - Copy `IndyOverlayDemo.vue` and `IndyIndicatorsDemo.vue` from
    `tests/vitepress/.vitepress/theme/components/` into the external repo.
  - Change the default `apiBaseUrl` prop from `https://localhost:5001` to
    `https://stock-charts-api.azurewebsites.net` in both components.
  - Copy `indy-demo-utils.ts` helper alongside the components (contains
    `requireListing`, `setSelectionParams` used by `IndyIndicatorsDemo`).
  - In Markdown pages, pass the `api-base-url` prop explicitly if the
    default is ever overridden per-page:

    ```markdown
    <IndyOverlayDemo
      api-base-url="https://stock-charts-api.azurewebsites.net"
    />
    ```

- [ ] Task 5.6: Add the external site origin to the deployed API's CORS allowlist
  - The deployed Web API reads allowed origins from `CorsOrigins:Website`
    in `server/WebApi/appsettings.json` (semicolon-separated). Currently
    contains only localhost origins.
  - Add the production domain of the external VitePress site (e.g.
    `https://your-docs-site.github.io` or custom domain) to that list and
    redeploy `WebApi`.
  - Also add the domain to the Azure Functions app settings if the external
    site calls Function endpoints directly.
  - Validate: open the external site in a browser, check the Network tab
    for preflight `OPTIONS` requests returning `200` with the
    `Access-Control-Allow-Origin` header set correctly.

- [ ] Task 5.7: Set up GitHub Actions CI/CD for the external repository
  - Create `.github/workflows/deploy.yml` triggered on push to `main`:

    ```yaml
    - name: Setup Node.js with GitHub Packages auth
      uses: actions/setup-node@v6
      with:
        node-version: 24
        registry-url: https://npm.pkg.github.com
        scope: "@facioquo"
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
    - name: Build VitePress site
      run: pnpm run build
    - name: Deploy to GitHub Pages
      uses: actions/deploy-pages@v4
    ```

  - Set `NODE_AUTH_TOKEN` repository secret to a PAT with `read:packages`.
  - Enable GitHub Pages in the repository settings (source: branch or
    Actions artifact depending on the deploy-pages setup).

- [ ] Task 5.8: End-to-end validation against the deployed API
  - Deploy the external site and open it in a browser.
  - Verify `IndyOverlayDemo` fetches quotes from
    `https://stock-charts-api.azurewebsites.net/quotes` and renders an
    OHLC candlestick chart.
  - Verify `IndyIndicatorsDemo` loads the indicator listings dropdown,
    requests selection data, and draws both overlay and oscillator charts.
  - Confirm no `Access-Control-Allow-Origin` errors in the browser console.
  - Confirm dark/light theme toggle re-renders charts correctly.
  - Run at least a manual smoke test against the URL before marking done.

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

### Selection helpers

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
