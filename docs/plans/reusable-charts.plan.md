# Plan: Reusable charts — external site integration

Remaining work to integrate `@facioquo/indy-charts` into an external VitePress
documentation site. Phases 1–4 (library extraction, Angular refactor, testing,
and publishing prep) are complete.

## Goal

Enable developers evaluating the
[Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators)
library to render interactive financial charts from any JavaScript framework
by consuming the `@facioquo/indy-charts` package as a single dependency.

## Architecture

### Library dependency chain

```text
consumer (Angular, VitePress, etc.)
  └─ @facioquo/indy-charts          (chart abstractions, API client, config, data)
       └─ @facioquo/chartjs-chart-financial  (Chart.js candlestick/OHLC/volume plugin)
            └─ chart.js              (peer dependency)
```

Consumers must never import `@facioquo/chartjs-chart-financial`, `chart.js`,
`chartjs-plugin-annotation`, `chartjs-adapter-date-fns`, or `date-fns` directly.
`@facioquo/indy-charts` re-exports and registers everything needed via
`setupIndyCharts()`. `chartjs-adapter-date-fns` and `date-fns` are bundled as
direct dependencies of `@facioquo/indy-charts` and install automatically.

### Packages

| Package | Workspace path | Description |
| :--- | :--- | :--- |
| `@facioquo/chartjs-chart-financial` | `libs/chartjs-financial/` | Chart.js financial plugin (candlestick, OHLC, volume) |
| `@facioquo/indy-charts` | `libs/indy-charts/` | High-level chart API, config, data transformers, API client |

### Consumers

| Consumer | Location | Notes |
| :--- | :--- | :--- |
| Angular website | `client/` | Primary showcase application (complete) |
| VitePress integration test | `tests/vitepress/` | Local integration test and docs reference (complete) |
| External VitePress docs site | Separate repository | **Remaining work below** |

## Tasks

Integrate `@facioquo/indy-charts` into the external VitePress documentation
site, consuming **published** packages from GitHub Packages and calling the
**deployed** API endpoint `https://stock-charts-api.azurewebsites.net`.

Task 5.1 is the gate for all others — packages must be published before the
external repo can install them.

- [x] Task 5.1: Publish packages to GitHub Packages
  - Both `publish-chartjs-financial.yml` and `publish-indy-charts.yml` trigger
    automatically on push to `main` when files under `libs/chartjs-financial/`
    or `libs/indy-charts/` change respectively. No manual release step needed.
  - Both workflows skip publish if the version in `package.json` is already
    present on the registry.
  - Confirm both `@facioquo/chartjs-chart-financial` and `@facioquo/indy-charts`
    appear under the repository Packages page with the `latest` dist-tag.

- [x] Task 5.2: Configure the external repository for GitHub Packages authentication
  - Create `.npmrc` at the repo root:

    ```text
    @facioquo:registry=https://npm.pkg.github.com
    //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
    ```

  - Add `NODE_AUTH_TOKEN` as a repository secret set to a classic PAT
    (`read:packages` scope) or `GITHUB_TOKEN` if the external repo is in
    the same GitHub org that owns the packages.
  - For local development, set `NODE_AUTH_TOKEN` via `.env` or shell profile
    (never commit a literal token).

- [x] Task 5.3: Install `@facioquo/indy-charts` and peer dependencies
  - Run `pnpm add @facioquo/indy-charts` — installs the published package plus
    its transitive dependency `@facioquo/chartjs-chart-financial`.
  - Install peer dependencies explicitly (pnpm requires it):
    `pnpm add chart.js chartjs-plugin-annotation`
  - `chartjs-adapter-date-fns` and `date-fns` are included as dependencies of
    `@facioquo/indy-charts` and install automatically — do not add them
    explicitly.
  - Do not add `@facioquo/chartjs-chart-financial` as a direct dependency; it
    is a transitive dep of `@facioquo/indy-charts`.

- [ ] Task 5.4: Configure VitePress `config.ts` for published package consumption
  - Unlike `tests/vitepress`, the external site must not use workspace path
    aliases that resolve to TypeScript source.
  - Add `ssr.noExternal` for `@facioquo/indy-charts` and Chart.js to prevent
    SSR externalisation failures. `chartjs-adapter-date-fns` and `date-fns` are
    included as dependencies of the package and do not need separate entries:

    ```typescript
    ssr: {
      noExternal: ["@facioquo/indy-charts", "chart.js"]
    }
    ```

  - Call `setupIndyChartsForVue(...)` from `@facioquo/indy-charts/vue` exactly
    once in `.vitepress/theme/index.ts` inside the `enhanceApp` hook.

- [ ] Task 5.5: Register `StockIndicatorChart` with the deployed API URL
  - Call `setupIndyChartsForVue` from `@facioquo/indy-charts/vue` in the
    external VitePress theme.
  - Configure the site-level `api.baseUrl` default as
    `https://stock-charts-api.azurewebsites.net`.
  - Use `<StockIndicatorChart indicator="..." />` from Markdown pages. Pass
    explicit `:config` overrides per-page if needed.

- [ ] Task 5.6: Add the external site origin to the deployed API's CORS allowlist
  - The deployed Web API reads allowed origins from `CorsOrigins:Website` in
    `server/WebApi/appsettings.json` (semicolon-separated). Currently contains
    only localhost origins.
  - Add the production domain of the external site (e.g.
    `https://your-docs-site.github.io` or custom domain) and redeploy `WebApi`.
  - Also add the domain to Azure Functions app settings if the external site
    calls Function endpoints directly.
  - Validate: check the Network tab for preflight `OPTIONS` requests returning
    `200` with the `Access-Control-Allow-Origin` header set correctly.

- [ ] Task 5.7: Set up GitHub Actions CI/CD for the external repository
  - Create `.github/workflows/deploy.yml` triggered on push to `main`:

    ```yaml
    - name: Setup Node.js with GitHub Packages auth
      uses: actions/setup-node@v4
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
  - Enable GitHub Pages in repository settings.

- [ ] Task 5.8: End-to-end validation against the deployed API
  - Deploy the external site and open it in a browser.
  - Verify `StockIndicatorChart` fetches quotes from
    `https://stock-charts-api.azurewebsites.net/quotes` and renders an
    OHLC candlestick chart.
  - Verify `StockIndicatorChart` requests selection data and draws both overlay
    and oscillator examples.
  - Confirm no `Access-Control-Allow-Origin` errors in the browser console.
  - Confirm dark/light theme toggle re-renders charts correctly.

## Deferred / future work

These items are intentionally out of scope for the current plan:

- **LocalStorage caching** — `ChartManager.enableCaching(key)` and
  `restoreState()`. Create a new task if needed.
- **Full `ChartManager` integration in VitePress demo** — the demo works but
  could be richer (window resize, dynamic indicator add/remove).
- **Higher-level oscillator container helper** — utility for dynamically
  creating oscillator canvas containers (currently consumer responsibility).
- **Error/fallback data strategy in library** — `createApiClient()` has an
  `onError` callback but no built-in fallback. Angular client implements its own
  fallback via backup JSON. Consider adding optional fallback to the library.

## Reference: library public API surface

### Setup

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

### Vue adapter

```typescript
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://stock-charts-api.azurewebsites.net" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: true },
      indicators: {
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
```

Then use the global component from Markdown:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

### API client

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://stock-charts-api.azurewebsites.net",
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
const chart = new OverlayChart(canvas, { isDarkTheme: false, showTooltips: true });
chart.render(quotes);

// Full manager with indicators
const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });
manager.initializeOverlay(canvas, quotes, 250);
manager.processSelectionData(selection, listing, indicatorRows);
manager.displaySelection(selection, listing);
manager.createOscillator(oscillatorCanvas, selection, listing);
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
