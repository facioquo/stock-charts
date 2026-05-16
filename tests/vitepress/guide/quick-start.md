# Quick start

This guide shows how to render financial charts using `@facioquo/indy-charts` in any JavaScript or TypeScript project. [VitePress integration](#using-vitepress) is covered below.

## Step 1: Initialize once

Call `setupIndyCharts()` once at application startup to register all Chart.js components, financial chart types, and required plugins:

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

Call this before creating any chart instances — once per application lifecycle. Safe to call multiple times; subsequent calls are no-ops.

## Step 2: Connect your API

Create an API client pointed at your stock-charts API endpoint:

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const api = createApiClient({
  baseUrl: "https://api.example.com"
});
```

See [API client configuration](/guide/api-client) for all options.

## Step 3: Render a price chart

Add a canvas element to your HTML:

```html
<canvas id="overlay-chart"></canvas>
```

Initialize the chart manager and overlay chart:

```typescript
import { ChartManager } from "@facioquo/indy-charts";

const quotes = await api.getQuotes();
const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });

const overlayCanvas = document.getElementById("overlay-chart") as HTMLCanvasElement;
manager.initializeOverlay(overlayCanvas, quotes, 250);
```

## Step 4: Add an indicator

Fetch available indicators, create a selection, load its data, then add it to the chart:

```typescript
import { createDefaultSelection, loadStaticIndicatorData } from "@facioquo/indy-charts";

const listings = await api.getListings();
const listing = listings.find(l => l.uiid === "RSI")!;
const selection = createDefaultSelection(listing, { lookbackPeriods: 14 });

const rawData = await api.getSelectionData(selection, listing);
const data = loadStaticIndicatorData(rawData);

manager.processSelectionData(selection, listing, data);
manager.displaySelection(selection, listing);

// Oscillator indicators (RSI, MACD, etc.) render in a separate canvas panel
if (listing.chartType === "oscillator") {
  const rsiCanvas = document.getElementById("rsi-chart") as HTMLCanvasElement;
  manager.createOscillator(rsiCanvas, selection, listing);
}
```

Add the oscillator canvas to your HTML alongside the overlay canvas:

```html
<canvas id="rsi-chart"></canvas>
```

## Using VitePress

The Vue adapter wraps the API above in a global `<StockIndicatorChart>` component, removing the need for manual canvas management. Works with VitePress, Nuxt, or any Vue 3 app.

### Register the adapter

In `.vitepress/theme/index.ts`:

```typescript
import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: true },
      indicators: {
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
  <StockIndicatorChart indicator="rsi" />
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

## What's next?

- See [basic example](/examples/) for a working demo
- Learn about [indicators](/examples/indicators)
- Explore [multiple charts](/examples/multiple)
- Read about [API client configuration](/guide/api-client)
