# Quick start

Render financial charts in any TypeScript or JavaScript project. VitePress integration is covered at the [bottom of this page](#using-vitepress).

## Step 1: Initialize once

Call `setupIndyCharts()` once at application startup. It registers the Chart.js controllers, elements, and financial chart types the library needs.

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

Safe to call multiple times — subsequent calls are no-ops.

## Step 2: Connect your API

Create an API client pointed at your stock-charts API endpoint:

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const api = createApiClient({
  baseUrl: "https://api.example.com"
});
```

See the [API client reference](/reference/api-client) for all options.

## Step 3: Render a price chart

Add a canvas to your HTML:

```html
<canvas id="overlay-chart"></canvas>
```

Initialize a `ChartManager` and render the candlestick + volume overlay:

```typescript
import { ChartManager } from "@facioquo/indy-charts";

const quotes = await api.getQuotes();
const manager = new ChartManager({
  settings: { isDarkTheme: false, showTooltips: true }
});

const overlayCanvas = document.getElementById("overlay-chart") as HTMLCanvasElement;
manager.initializeOverlay(overlayCanvas, quotes, 250);
```

`250` is the visible-bar count. The chart fits the latest 250 quotes into the canvas; older history stays available for window resizing via `manager.setBarCount(n)`.

## Step 4: Add an overlay indicator (EMA)

Overlay indicators (EMA, SMA, Bollinger Bands, …) render on the same canvas as the price chart. Fetch the listing, build a selection, load its data, then attach it:

```typescript
import { createDefaultSelection, loadStaticIndicatorData } from "@facioquo/indy-charts";

const listings = await api.getListings();
const emaListing = listings.find(l => l.uiid === "EMA")!;
const emaSelection = createDefaultSelection(emaListing, { lookbackPeriods: 20 });

const emaRows = loadStaticIndicatorData(
  await api.getSelectionData(emaSelection, emaListing)
);

manager.processSelectionData(emaSelection, emaListing, emaRows);
manager.displaySelection(emaSelection, emaListing);
```

That's it — the EMA line is now drawn on the price chart.

## Step 5: Add an oscillator indicator (RSI)

Oscillators (RSI, MACD, Stochastic, …) render in their **own** canvas. Add a second canvas to your HTML:

```html
<canvas id="rsi-chart"></canvas>
```

The setup is identical until the last call — instead of `displaySelection` drawing on the overlay, you also call `createOscillator` with the oscillator canvas:

```typescript
const rsiListing = listings.find(l => l.uiid === "RSI")!;
const rsiSelection = createDefaultSelection(rsiListing, { lookbackPeriods: 14 });

const rsiRows = loadStaticIndicatorData(
  await api.getSelectionData(rsiSelection, rsiListing)
);

manager.processSelectionData(rsiSelection, rsiListing, rsiRows);
manager.displaySelection(rsiSelection, rsiListing);

const rsiCanvas = document.getElementById("rsi-chart") as HTMLCanvasElement;
manager.createOscillator(rsiCanvas, rsiSelection, rsiListing);
```

A single `ChartManager` instance can drive any number of overlay + oscillator indicators against the same quote series.

## Using VitePress

For VitePress (or any Vue 3) site, the `<StockIndicatorChart>` component handles all of the above for you. Register the adapter once and drop chart components in your Markdown.

### Set up the component

In `.vitepress/theme/index.ts`:

```typescript
import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: false },
      indicators: {
        ema: {
          uiid: "EMA",
          title: "EMA(20)",
          params: { lookbackPeriods: 20 }
        },
        rsi: {
          uiid: "RSI",
          title: "RSI(14)",
          params: { lookbackPeriods: 14 },
          results: ["rsi"]
        }
      }
    });
  }
};
```

### Add a chart to Markdown

```vue
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

Override per-page options with `:config`:

```vue
<ClientOnly>
  <StockIndicatorChart
    indicator="rsi"
    :config="{ title: 'RSI(21)', params: { lookbackPeriods: 21 } }"
  />
</ClientOnly>
```

Have a single component render **both** the price chart and the oscillator stacked together by setting `:with-overlay="true"` — no separate price-chart component required:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

The instance manages its own price/volume canvas above the RSI panel; it does not look at adjacent siblings.

To pair an **overlay indicator** (e.g. Bollinger Bands) with its **companion oscillator** (e.g. %B) in one aligned chart, use the `with` prop — both render under a single `ChartManager`, sharing the price panel's x-axis:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="bb" with="bbPctB" />
</ClientOnly>
```

> [!warning]
> X-axis alignment requires **one** component (one `ChartManager`). Two separate `<StockIndicatorChart>` instances stacked on a page do not share x-axis geometry — a standalone oscillator auto-ranges to its own data. Use `with` or `:with-overlay="true"` to keep panels aligned.

## What's next?

- See the [overlay example](/examples/) for a working live demo
- Learn about [oscillator indicators](/examples/indicators)
- Supply [custom data](/examples/custom-data) without an API
- Read the [API client reference](/reference/api-client)
