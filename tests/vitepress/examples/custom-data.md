<script setup>
import StaticChart from "./StaticChart.vue";
</script>

# Custom data (bring your own)

Render a candlestick + volume chart **and** a technical indicator overlay directly from your own quote data — no API required.

## Live demo

<ClientOnly>
  <StaticChart />
</ClientOnly>

The chart above plots OHLC + volume from a hard-coded `Quote[]` array (ISO string timestamps normalized to `Date` via `loadStaticQuotes`), with an EMA(20) line computed locally. Everything below ships in the page bundle — no network calls.

## How it works

`OverlayChart` is a lower-level building block exported from `@facioquo/indy-charts`. Unlike `StockIndicatorChart`, it does not fetch data from an API — you supply the quotes directly. Add indicators by pushing your own `ChartDataset` onto `chart.data.datasets` after `render()`.

```typescript
import { OverlayChart, loadStaticQuotes } from "@facioquo/indy-charts";
import type { Quote } from "@facioquo/indy-charts";

// Quote.timestamp accepts ISO strings or Date instances.
const quotes: Quote[] = loadStaticQuotes([
  { timestamp: "2025-01-02", open: 180.00, high: 182.50, low: 179.20, close: 181.80, volume: 38500000 },
  // ... more bars
]);

const canvas = document.getElementById("my-canvas") as HTMLCanvasElement;
const chart = new OverlayChart(canvas, { isDarkTheme: false, showTooltips: false });
chart.render(quotes);

// Push an EMA(20) line onto the existing chart.
chart.chart?.data.datasets.push(buildEmaDataset(quotes, 20));
chart.chart?.update("none");
```

## Computing the EMA locally

Without an API to compute indicators server-side, you can do it inline. EMA is just a recurrence:

```typescript
function computeEma(closes: number[], period: number): number[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error(`EMA period must be a positive integer, got ${period}`);
  }
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period) return result;

  // Seed with SMA of the first `period` closes.
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;

  // Standard EMA recurrence after the seed.
  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}
```

Then wrap the result into a Chart.js line dataset on the price y-axis:

```typescript
import type { ChartDataset, ScatterDataPoint } from "chart.js";

function buildEmaDataset(quotes: Quote[], period: number): ChartDataset<"line", ScatterDataPoint[]> {
  const ema = computeEma(quotes.map(q => q.close), period);
  return {
    type: "line",
    label: `EMA(${period})`,
    data: quotes.map((q, i) => ({ x: new Date(q.timestamp).valueOf(), y: ema[i] })),
    yAxisID: "y",
    borderColor: "#FFA726",
    backgroundColor: "#FFA726",
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    spanGaps: false,
    order: 0
  };
}
```

## Source code

The full Vue component driving the demo above:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  OverlayChart,
  loadStaticQuotes,
  setupIndyCharts,
  type Quote
} from "@facioquo/indy-charts";
import type { ChartDataset, ScatterDataPoint } from "chart.js";

// Quote.timestamp accepts ISO strings or Date instances.
const quotes: Quote[] = loadStaticQuotes([
  { timestamp: "2025-01-02", open: 180.00, high: 182.50, low: 179.20, close: 181.80, volume: 38500000 },
  // ... more bars
]);

function computeEma(closes: number[], period: number): number[] {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error(`EMA period must be a positive integer, got ${period}`);
  }
  const k = 2 / (period + 1);
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  result[period - 1] = sum / period;
  for (let i = period; i < closes.length; i++) {
    result[i] = closes[i] * k + result[i - 1] * (1 - k);
  }
  return result;
}

function buildEmaDataset(period: number): ChartDataset<"line", ScatterDataPoint[]> {
  const ema = computeEma(quotes.map(q => q.close), period);
  return {
    type: "line",
    label: `EMA(${period})`,
    data: quotes.map((q, i) => ({ x: new Date(q.timestamp).valueOf(), y: ema[i] })),
    yAxisID: "y",
    borderColor: "#FFA726",
    backgroundColor: "#FFA726",
    borderWidth: 1.5,
    pointRadius: 0,
    fill: false,
    spanGaps: false,
    order: 0
  };
}

const canvasEl = ref<HTMLCanvasElement | null>(null);
let overlayChart: OverlayChart | null = null;
let observer: MutationObserver | null = null;

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function renderChart() {
  if (!canvasEl.value) return;
  setupIndyCharts();
  overlayChart?.destroy();
  overlayChart = new OverlayChart(canvasEl.value, {
    isDarkTheme: isDark(),
    showTooltips: false,
    background: isDark() ? "#1b1b1f80" : "#ffffff80"
  });
  overlayChart.render(quotes);
  overlayChart.chart?.data.datasets.push(buildEmaDataset(20));
  overlayChart.chart?.update("none");
}

onMounted(() => {
  renderChart();
  observer = new MutationObserver(() => renderChart());
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"]
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
  overlayChart?.destroy();
  overlayChart = null;
});
</script>

<template>
  <canvas ref="canvasEl" />
</template>
```

## Key points

- **`Quote`**: single OHLCV bar — `timestamp` accepts an ISO string or `Date` instance, the rest are numeric. Type your fixture arrays as `Quote[]`.
- **`loadStaticQuotes`**: normalizes `Quote.timestamp` to a `Date` (no-op when already a Date)
- **`OverlayChart`**: renders candlestick and volume directly onto a `<canvas>` element
- **Custom indicators**: push your own `ChartDataset` onto `chart.data.datasets` after `render()`, then call `chart.update("none")`. Any Chart.js dataset shape works — line, dot, bar, etc.
- **Theme sync**: re-create the chart on `document.documentElement` class changes to follow the page's dark / light mode automatically
- **Cleanup**: always call `chart.destroy()` (the wrapper) in the component's unmount hook — never `chart.chart?.destroy()` (Chart.js only), which leaks the wrapper's cached state

## Next steps

- Return to the [basic chart](/examples/) example
- See an [oscillator paired with overlay](/examples/indicators)
- Read the [API client reference](/reference/api-client)
