<script setup>
import StaticChart from "./StaticChart.vue";
</script>

# Custom data (bring your own)

Render a chart directly from your own quote data — no API required.

## Live demo

<ClientOnly>
  <StaticChart />
</ClientOnly>

## How it works

`OverlayChart` is a lower-level building block exported from `@facioquo/indy-charts`. Unlike `StockIndicatorChart`, it does not fetch data from an API — you supply the quotes directly.

```typescript
import { OverlayChart, loadStaticQuotes } from "@facioquo/indy-charts";
import type { Quote } from "@facioquo/indy-charts";

const quotes: Quote[] = [
  { timestamp: "2025-01-02", open: 180.00, high: 182.50, low: 179.20, close: 181.80, volume: 38500000 },
  // ... more bars
];

const canvas = document.getElementById("my-canvas") as HTMLCanvasElement;
const chart = new OverlayChart(canvas, { isDarkTheme: false, showTooltips: false });
chart.render(loadStaticQuotes(quotes));
```

## Source code

The Vue component driving the demo above:

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { OverlayChart, loadStaticQuotes } from "@facioquo/indy-charts";
import type { Quote } from "@facioquo/indy-charts";

const quotes: Quote[] = [
  { timestamp: "2025-01-02", open: 180.00, high: 182.50, low: 179.20, close: 181.80, volume: 38500000 },
  // ... more bars
];

const processedQuotes = loadStaticQuotes(quotes);
const canvasEl = ref<HTMLCanvasElement | null>(null);
let overlayChart: OverlayChart | null = null;
let observer: MutationObserver | null = null;

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function renderChart() {
  if (!canvasEl.value) return;
  overlayChart?.chart?.destroy();
  overlayChart = new OverlayChart(canvasEl.value, {
    isDarkTheme: isDark(),
    showTooltips: false,
    background: isDark() ? "#1b1b1f80" : "#ffffff80"
  });
  overlayChart.render(processedQuotes);
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
  overlayChart?.chart?.destroy();
  overlayChart = null;
});
</script>

<template>
  <canvas ref="canvasEl" />
</template>
```

## Key points

- **`Quote`**: input shape with ISO string `timestamp` and numeric OHLCV fields
- **`loadStaticQuotes`**: converts `timestamp` strings to `Date` objects, returning `Quote[]`
- **`OverlayChart`**: renders candlestick and volume directly onto a `<canvas>` element
- **Theme sync**: re-create the chart on `document.documentElement` class changes to follow the page's dark / light mode automatically
- **Cleanup**: always call `chart.destroy()` in the component's unmount hook

## Next steps

- Add [technical indicators from the API](/examples/indicators)
- Render [multiple charts](/examples/multiple) on one page
- Return to the [basic chart](/examples/) example
