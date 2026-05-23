# @facioquo/indy-charts

Framework-agnostic financial charting library for [Chart.js](https://chartjs.org). Renders candlestick + volume price charts, oscillator subcharts, and a wide range of technical indicators against a REST API or your own static data.

## Features

- **Price + volume overlay** — candlestick and volume on a single canvas
- **Oscillator subcharts** — RSI, MACD, Stochastic, etc., standalone or paired with the price chart
- **Technical indicators** — SMA, EMA, RSI, MACD, Bollinger Bands, and more (computed server-side via the stock-charts REST API; this library renders the results)
- **Bring-your-own data** — feed `OverlayChart` a `Quote[]` directly with no API
- **Light + dark themes** — built-in palettes plus per-instance and site-wide background overrides
- **Vue 3 adapter** — optional `<StockIndicatorChart>` component for Vue / VitePress sites
- **Strict TypeScript** — ES2020 target, full type definitions, no `any` in the public surface

## Installation

```bash
npm install @facioquo/indy-charts chart.js chartjs-plugin-annotation
```

Add `vue` only if you intend to use the Vue adapter (`@facioquo/indy-charts/vue`) — most non-Vue consumers do not need it.

## Quick start

The simplest path is `OverlayChart` rendering a candlestick chart against the REST API:

```typescript
import { createApiClient, OverlayChart, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({ baseUrl: "https://api.example.com" });
const quotes = await client.getQuotes();

const canvas = document.getElementById("main-chart");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Chart canvas not found");
}

const chart = new OverlayChart(canvas, { isDarkTheme: false, showTooltips: true });
chart.render(quotes.slice(-250));

// In your component's unmount / cleanup hook:
chart.destroy(); // NOT chart.chart?.destroy() — see "Teardown contract" below
```

### Teardown contract

`OverlayChart`, `OscillatorChart`, and `ChartManager` all expose a `destroy()`
method that releases the wrapper's cached state (legend selections, threshold
datasets, full quote/dataset history on `ChartManager`) **and** tears down
the underlying Chart.js instance. Always call the wrapper's `destroy()` —
never reach into `chart.chart?.destroy()`, which only tears down Chart.js
and leaks the wrapper's cached state.

For indicators, the responsive viewport, and oscillator subcharts, use `ChartManager`:

```typescript
import {
  ChartManager,
  createApiClient,
  createDefaultSelection,
  loadStaticIndicatorData,
  setupIndyCharts
} from "@facioquo/indy-charts";

setupIndyCharts();

const api = createApiClient({ baseUrl: "https://api.example.com" });
const [quotes, listings] = await Promise.all([api.getQuotes(), api.getListings()]);

const priceCanvas = document.getElementById("price-chart");
if (!(priceCanvas instanceof HTMLCanvasElement)) {
  throw new Error("Price chart canvas not found");
}

const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });
manager.initializeOverlay(priceCanvas, quotes, 250);

// Overlay indicator (EMA) renders on the price canvas.
const ema = listings.find(l => l.uiid === "EMA")!;
const emaSel = createDefaultSelection(ema, { lookbackPeriods: 20 });
manager.processSelectionData(
  emaSel,
  ema,
  loadStaticIndicatorData(await api.getSelectionData(emaSel, ema))
);
manager.displaySelection(emaSel, ema);

// Oscillator indicator (RSI) renders in its own canvas.
const rsi = listings.find(l => l.uiid === "RSI")!;
const rsiSel = createDefaultSelection(rsi, { lookbackPeriods: 14 });
manager.processSelectionData(
  rsiSel,
  rsi,
  loadStaticIndicatorData(await api.getSelectionData(rsiSel, rsi))
);
manager.displaySelection(rsiSel, rsi);

const rsiCanvas = document.getElementById("rsi-chart");
if (!(rsiCanvas instanceof HTMLCanvasElement)) {
  throw new Error("RSI chart canvas not found");
}
manager.createOscillator(rsiCanvas, rsiSel, rsi);
```

## Usage with Vue 3 / VitePress

Register the optional Vue adapter once in your app entry point (e.g. `.vitepress/theme/index.ts` for VitePress, or `main.ts` for plain Vue):

```typescript
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: false },
      indicators: {
        ema: { uiid: "EMA", title: "EMA(20)", params: { lookbackPeriods: 20 } },
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
```

Use the global component from Markdown / templates. Each instance is self-contained — `:with-overlay="true"` tells **a single oscillator instance** to also render its own price/volume chart above the oscillator panel; it does **not** pair the component with the adjacent `ema` instance.

```vue
<!-- An overlay indicator (EMA) on the price chart. -->
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>

<!-- A standalone oscillator (RSI), no price chart. -->
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>

<!-- One instance: price chart + RSI panel stacked together. -->
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

## Public exports

| Export | Purpose |
| --- | --- |
| `setupIndyCharts()` | Register Chart.js controllers + financial chart types (call once at startup) |
| `ChartManager` | Lifecycle orchestrator for overlay + oscillator charts and viewport changes |
| `OverlayChart`, `OscillatorChart` | Lower-level chart classes if you don't need `ChartManager` |
| `createApiClient(config)` | Typed `fetch` client for `GET /quotes`, `GET /indicators`, indicator data |
| `loadStaticQuotes`, `loadStaticIndicatorData` | Normalize bring-your-own quote and indicator arrays |
| `createDefaultSelection`, `applySelectionTokens`, `calculateOptimalBars` | Selection / viewport helpers |
| `getThemeColors`, `baseOverlayConfig`, `baseOscillatorConfig` | Theme + config building blocks |
| `setupIndyChartsForVue` (`/vue` subpath) | Vue 3 adapter that registers `<StockIndicatorChart>` globally |

Full TypeScript definitions ship with the package — no `@types/` install required.

## License

Apache-2.0. The full license text is shipped in the `LICENSE` file alongside this README.

## Related projects

- [facioquo/stock-charts](https://github.com/facioquo/stock-charts) — reference website and REST API that pair with this library
- [`@facioquo/chartjs-chart-financial`](https://github.com/facioquo/stock-charts/tree/main/libs/chartjs-financial) — Chart.js financial chart types (bundled inside this package; no separate install required)
- [Skender.Stock.Indicators](https://www.nuget.org/packages/Skender.Stock.Indicators) — .NET indicator computation library that powers the REST API
