# @facioquo/indy-charts

> Quick-reference idiomatic syntax for `@facioquo/indy-charts` — framework-agnostic
> financial charts on Chart.js, with an optional Vue 3 adapter and an optional
> backing HTTP API you can host yourself.
> Chart.js reference: <https://www.chartjs.org/docs/latest/>
> Backing API contract: `backing-api.yml`, shipped in this package.

Two things ship here: the charts, and the shape of the server they can read from. Use the first without the second unless you want indicators computed for you.

## The rule that governs everything below

**Data goes in through one of two doors, and mixing them is the mistake to avoid.**

Either you supply bars and indicator rows yourself (`loadStaticQuotes`, `loadStaticIndicatorData`), or you point the client at a server implementing `backing-api.yml` (`createApiClient`). Both produce the same `Bar[]` and `IndicatorDataRow[]`, and every chart class takes it from there.

Nothing in the rendering path knows which door the data came through. When a chart looks wrong, that is where to start: the data reached it, or it did not.

## Setup

Register the Chart.js controllers once, at application start, before constructing any chart.

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

Calling it more than once is harmless. Never calling it produces a Chart.js "controller not registered" error at the first render, not at import.

Peer dependencies you install yourself:

```bash
npm install @facioquo/indy-charts chart.js chartjs-plugin-annotation
```

Add `vue` only for the Vue adapter.

## Charts

`ChartManager` is the default. It owns the overlay chart, any oscillator panes, the responsive viewport, and the teardown of all of them.

```typescript
import { ChartManager, createDefaultSelection, loadStaticIndicatorData } from "@facioquo/indy-charts";

const manager = new ChartManager({
  settings: { isDarkTheme: false, showTooltips: true }
});
manager.initializeOverlay(priceCanvas, quotes, 250);

const listing = listings.find(l => l.uiid === "EMA")!;
const selection = createDefaultSelection(listing, { lookbackPeriods: 20 });
manager.processSelectionData(selection, listing, loadStaticIndicatorData(rows));
manager.displaySelection(selection, listing);
```

Reach for `OverlayChart` or `OscillatorChart` directly only when you want one canvas and no viewport management.

### Teardown

Call the wrapper's `destroy()`, never `chart.chart?.destroy()`. The latter tears down Chart.js and leaves the wrapper holding legend selections, threshold datasets, and the full quote history.

```typescript
manager.destroy();
```

### Where a chart renders

`chartType` on the listing decides, and you do not override it: `overlay` draws on the price canvas, `oscillator` needs its own canvas via `manager.createOscillator(canvas, selection, listing)`.

## Vue and VitePress

Register once in the app entry, then use the component anywhere.

```typescript
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      indicators: {
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
```

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

`<ClientOnly>` is required in VitePress: the charts need a canvas, and there is none during static rendering.

`:with-overlay` tells **that one instance** to render a price chart above its oscillator. It does not pair the component with a sibling instance.

## The backing API

Optional. Skip this whole section if you supply your own data.

`createApiClient({ baseUrl })` expects three operations, specified in `backing-api.yml`:

| Operation | Returns | Client method |
| --- | --- | --- |
| `GET /quotes` | `Bar[]`, oldest first | `getQuotes()` |
| `GET /indicators` | `IndicatorListing[]` | `getListings()` |
| Each listing's `endpoint` | `IndicatorDataRow[]` | `getSelectionData()` |

Preview the contract:

```bash
npx @redocly/cli build-docs node_modules/@facioquo/indy-charts/dist/backing-api.yml
```

### The catalog is the interface

There is no fixed list of indicator routes. `GET /indicators` returns entries that each carry the `endpoint` to call and the `parameters` it accepts, and the client builds every indicator request from that. Adding an indicator is a catalog change; the HTTP contract does not move.

Entries do not map one-to-one onto routes — several may share an endpoint and differ only in which `results` they chart.

### Resolving `endpoint`

The client computes `new URL(listing.endpoint, baseUrl)`. An absolute `endpoint` is fetched as given and ignores `baseUrl`; a relative one resolves against it. Both work.

Behind a proxy, emit your public origin. A server that echoes the address it saw the request arrive on sends the browser somewhere it cannot reach.

### Status codes the client acts on

Return **503** for anything a retry could fix, and **429** to ask for a slower one. The client retries both with exponential back-off, honours `Retry-After`, and falls back to its last good response. Every other 4xx is final and surfaces to the user.

That distinction is the one thing most worth getting right when implementing this interface: a source that is briefly unavailable and reports it as, say, a 404 turns a recoverable gap into a broken chart.

### Serving your own

Any server answering those three operations works. A reference implementation of the .NET side lives in <https://github.com/facioquo/stock-charts>; `backing-api.yml` is what yours conforms to.

Responses are camelCase, timestamps ISO 8601. Each indicator row carries a `timestamp` plus one field per `dataName` the listing declares, `null` where the indicator has not warmed up.

## Resilience

The client retries and caches on its own once configured:

```typescript
createApiClient({
  baseUrl: "https://api.example.com",
  retry: { maxAttempts: 3, baseDelayMs: 200 },
  staleCache: true
});
```

`staleCache` keeps the last good response per URL in `sessionStorage` and serves it when a fetch fails. It is per-tab and empty for a first-time visitor, so it covers a blip rather than an origin that is gone.

## What this package exports

| Export | Purpose |
| --- | --- |
| `setupIndyCharts()` | Register Chart.js controllers and financial chart types |
| `setupIndyChartsForVue(app, config)` | Vue adapter (`/vue` subpath), registers `<StockIndicatorChart>` |
| `ChartManager` | Overlay + oscillators + viewport, with teardown |
| `OverlayChart`, `OscillatorChart` | Single-canvas classes |
| `createApiClient(config)` | Client for the three backing-API operations |
| `loadStaticQuotes`, `loadStaticIndicatorData` | Bring-your-own `Bar[]` / `IndicatorDataRow[]` |
| `createDefaultSelection`, `applySelectionTokens`, `calculateOptimalBars` | Selection and viewport helpers |
| `getThemeColors`, `baseOverlayConfig`, `baseOscillatorConfig` | Theme and config building blocks |

Types ship with the package. `Bar` is the quote type — `timestamp`, `open`, `high`, `low`, `close`, `volume` — and is what `getQuotes()` returns and `loadStaticQuotes()` accepts.
