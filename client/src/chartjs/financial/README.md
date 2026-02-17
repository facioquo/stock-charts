# @stock-charts/financial

Financial charting extension for [Chart.js](https://www.chartjs.org/) v4.5+.
Provides candlestick/OHLC controllers, indicator chart configuration,
data transformation utilities, and a high-level `ChartManager` class
for building interactive stock chart dashboards.

## Features

- **Candlestick and OHLC charts**: Visual representations of price movements
- **Indicator support**: Overlay and oscillator indicator configurations
  with 6 line types (solid, dash, dots, bar, pointer, none)
- **ChartManager**: High-level coordinator for multi-chart dashboards
- **Framework-agnostic**: No Angular, React, or Vue dependencies
- **Static data loading**: Synchronous functions for SSG/build-time rendering
- **API client**: Fetch-based client for retrieving quote and indicator data
- **Themeable**: Light and dark mode with configurable color palettes
- **TypeScript**: Full type definitions included

## Installation

```bash
npm install @stock-charts/financial chart.js chartjs-adapter-date-fns date-fns chartjs-plugin-annotation
```

All peer dependencies must be installed alongside the library.

## Quick start

```ts
import {
  registerFinancialCharts,
  ChartManager,
  ChartSettings,
  Quote
} from "@stock-charts/financial";

// Register Chart.js controllers and elements (once, at app startup)
registerFinancialCharts();

// Configure settings
const settings: ChartSettings = {
  isDarkTheme: false,
  showTooltips: true
};

// Create a chart manager
const manager = new ChartManager({ settings });

// Initialize with quote data and a canvas element
const canvas = document.getElementById("overlay") as HTMLCanvasElement;
manager.initializeOverlay(canvas, quotes, 250);
```

## API reference

### Registration

- **`registerFinancialCharts()`** — registers `CandlestickController`,
  `OhlcController`, `CandlestickElement`, and `OhlcElement` with Chart.js.
  Call once at application startup.

### ChartManager

High-level coordinator that manages an overlay chart (candlestick + volume)
and multiple oscillator charts.

```ts
const manager = new ChartManager({ settings, extraBars: 7 });
```

| Method                                           | Description                                   |
| ------------------------------------------------ | --------------------------------------------- |
| `initializeOverlay(ctx, quotes, barCount)`       | Create the candlestick + volume overlay chart |
| `processSelectionData(selection, listing, data)` | Prepare indicator datasets                    |
| `displaySelection(selection, listing)`           | Display indicator on overlay chart            |
| `createOscillator(ctx, selection, listing)`      | Create an oscillator chart                    |
| `removeSelection(ucid)`                          | Remove an indicator and its chart             |
| `updateTheme(settings)`                          | Update theme across all charts                |
| `setBarCount(barCount)`                          | Resize all charts to show N bars              |
| `resize()`                                       | Force all charts to resize                    |
| `destroy()`                                      | Destroy all charts and clean up               |

### OverlayChart and OscillatorChart

Lower-level chart wrappers used internally by `ChartManager`.
Use `ChartManager` unless you need fine-grained control.

### Config builders

Pure functions for building Chart.js configurations:

- `baseOverlayConfig(volumeAxisSize, settings)` — candlestick chart config
- `baseOscillatorConfig(settings)` — line chart config for oscillators
- `baseDataset(result, resultConfig)` — dataset for indicators
- `createThresholdDataset(threshold, firstResult, index)` — threshold lines
- `commonLegendAnnotation(label, x, y, yAdj, settings)` — legend labels

### Data transformers

- `processQuoteData(quotes)` — converts quotes to `FinancialDataPoint[]`
  and calculates `volumeAxisSize`
- `buildDataPoints(data, result, listing)` — converts indicator data to
  scatter data points with optional candlestick pattern coloring
- `addExtraBars(dataPoints, count)` — adds NaN padding bars on right edge

### Financial chart primitives

- `buildCandlestickDataset(data, borderColor)` — create typed candlestick datasets
- `buildVolumeDataset(quotes, extraBars, palette)` — create volume bar datasets
- `getFinancialPalette(mode)` — get predefined color palette (`"light"` or `"dark"`)
- `applyFinancialElementTheme(palette)` — apply theme to chart elements

### API client

```ts
import { createApiClient } from "@stock-charts/financial";

const api = createApiClient({
  baseUrl: "https://your-api.example.com",
  onError: (context, error) => console.error(context, error)
});

const quotes = await api.getQuotes();
const listings = await api.getListings();
```

### Static data loading

For build-time rendering (VitePress SSG, static sites):

```ts
import { loadStaticQuotes } from "@stock-charts/financial";
import rawQuotes from "./data/quotes.json";

const quotes = loadStaticQuotes(rawQuotes);
```

## VitePress integration

Since Chart.js requires a DOM canvas, charts must render client-side.
Use Vue's `onMounted` lifecycle hook:

```vue
<script setup>
import { onMounted, ref, watch } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const canvasRef = ref(null);
let manager = null;

onMounted(async () => {
  const { registerFinancialCharts, ChartManager, loadStaticQuotes } =
    await import("@stock-charts/financial");

  registerFinancialCharts();

  const quotes = loadStaticQuotes(rawQuotesData);

  manager = new ChartManager({
    settings: { isDarkTheme: isDark.value, showTooltips: true }
  });

  manager.initializeOverlay(canvasRef.value, quotes, 250);
});

// Sync theme with VitePress dark mode toggle
watch(isDark, dark => {
  if (manager) {
    manager.updateTheme({ isDarkTheme: dark, showTooltips: true });
  }
});
</script>

<template>
  <canvas ref="canvasRef" />
</template>
```

### SSR safety

All Chart.js operations require a browser DOM. When using SSR:

1. Use dynamic `import()` inside `onMounted()` (shown above)
2. Or wrap components with `<ClientOnly>`:

```vue
<ClientOnly>
  <StockChart :quotes="quotes" />
</ClientOnly>
```

## Types

All TypeScript types are exported from the main entry point:

```ts
import type {
  ChartSettings,
  Quote,
  RawQuote,
  IndicatorListing,
  IndicatorSelection,
  IndicatorResult,
  ChartConfig,
  ChartThreshold,
  ChartFill,
  FinancialDataPoint,
  FinancialPalette,
  ApiClient,
  ApiClientConfig,
  ChartManagerConfig
} from "@stock-charts/financial";
```

## Data format

Financial data points use the following structure:

```ts
interface FinancialDataPoint {
  x: number; // Timestamp (milliseconds)
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
}
```

## License

MIT License

Derived from [chartjs-chart-financial](https://github.com/chartjs/chartjs-chart-financial) (MIT License).
Adapted for Chart.js v4.5+ with TypeScript and modern API patterns.
