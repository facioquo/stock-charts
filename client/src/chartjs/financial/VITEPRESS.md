# VitePress Integration Guide

Complete guide for integrating `@stock-charts/financial` charts into a VitePress documentation site.

## Overview

This guide shows how to render interactive Chart.js financial charts in VitePress, handling SSR constraints, theming, and static data loading.

## Prerequisites

```bash
npm install @stock-charts/financial chart.js chartjs-adapter-date-fns date-fns chartjs-plugin-annotation
```

## Quick Start

### 1. Basic Vue component with chart

Create a chart component at `.vitepress/components/StockChart.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Quote } from "@stock-charts/financial";

const props = defineProps<{
  quotes: Quote[];
  barCount?: number;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let manager: any = null;

onMounted(async () => {
  // Dynamic import to avoid SSR issues
  const { registerFinancialCharts, ChartManager } =
    await import("@stock-charts/financial");

  registerFinancialCharts();

  manager = new ChartManager({
    settings: { isDarkTheme: false, showTooltips: true }
  });

  if (canvasRef.value) {
    manager.initializeOverlay(
      canvasRef.value,
      props.quotes,
      props.barCount ?? 250
    );
  }
});
</script>

<template>
  <div class="stock-chart">
    <canvas ref="canvasRef" />
  </div>
</template>

<style scoped>
.stock-chart {
  width: 100%;
  height: 400px;
  margin: 2rem 0;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
```

### 2. Use in markdown with static data

In your markdown file (e.g., `docs/examples/candlestick.md`):

```vue
<script setup>
import StockChart from "../.vitepress/components/StockChart.vue";
import quotesData from "../data/quotes.json";
import { loadStaticQuotes } from "@stock-charts/financial";

// Transform raw JSON to Quote objects (date strings → Date objects)
const quotes = loadStaticQuotes(quotesData);
</script>

# Candlestick Chart Example This example shows a 6-month price history with
volume.

<ClientOnly>
  <StockChart :quotes="quotes" :bar-count="120" />
</ClientOnly>
```

## Theme Integration

### Sync with VitePress dark mode

Update `StockChart.vue` to respond to VitePress theme changes:

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useData } from "vitepress";
import type { Quote } from "@stock-charts/financial";

const { isDark } = useData();
const props = defineProps<{
  quotes: Quote[];
  barCount?: number;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let manager: any = null;

onMounted(async () => {
  const { registerFinancialCharts, ChartManager } =
    await import("@stock-charts/financial");

  registerFinancialCharts();

  manager = new ChartManager({
    settings: {
      isDarkTheme: isDark.value,
      showTooltips: true
    }
  });

  if (canvasRef.value) {
    manager.initializeOverlay(
      canvasRef.value,
      props.quotes,
      props.barCount ?? 250
    );
  }
});

// Watch for theme changes and update all charts
watch(isDark, dark => {
  if (manager) {
    manager.updateTheme({
      isDarkTheme: dark,
      showTooltips: true
    });
  }
});

onBeforeUnmount(() => {
  if (manager?.destroyOverlay) {
    manager.destroyOverlay();
  }
  if (manager?.destroy) {
    manager.destroy();
  }
  manager = null;
  canvasRef.value = null;
});
</script>

<template>
  <div class="stock-chart">
    <canvas ref="canvasRef" />
  </div>
</template>
```

## Advanced Usage

### Multi-chart dashboard with indicators

Create `IndicatorDashboard.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from "vue";
import { useData } from "vitepress";
import type {
  Quote,
  IndicatorListing,
  IndicatorSelection,
  IndicatorDataRow
} from "@stock-charts/financial";

const { isDark } = useData();
const props = defineProps<{
  quotes: Quote[];
  listings: IndicatorListing[];
  indicators: Array<{
    listing: IndicatorListing;
    data: IndicatorDataRow[];
    selection: IndicatorSelection;
  }>;
}>();

const overlayRef = ref<HTMLCanvasElement | null>(null);
const oscillatorRefs = ref<HTMLCanvasElement[]>([]);
let manager: any = null;

onMounted(async () => {
  const { registerFinancialCharts, ChartManager } =
    await import("@stock-charts/financial");

  registerFinancialCharts();

  manager = new ChartManager({
    settings: {
      isDarkTheme: isDark.value,
      showTooltips: true
    }
  });

  // Initialize overlay chart
  if (overlayRef.value) {
    manager.initializeOverlay(overlayRef.value, props.quotes, 250);
  }

  // Add indicators
  props.indicators.forEach((indicator, index) => {
    manager.processSelectionData(
      indicator.selection,
      indicator.listing,
      indicator.data
    );

    if (indicator.listing.chartType === "overlay") {
      manager.displaySelection(indicator.selection, indicator.listing);
    } else if (indicator.listing.chartType === "oscillator") {
      const canvas = oscillatorRefs.value[index];
      if (canvas) {
        manager.createOscillator(
          canvas,
          indicator.selection,
          indicator.listing
        );
      }
    }
  });
});

watch(isDark, dark => {
  if (manager) {
    manager.updateTheme({
      isDarkTheme: dark,
      showTooltips: true
    });
  }
});

onBeforeUnmount(() => {
  if (manager) {
    manager.destroy();
  }
});

const setOscillatorRef = (el: any, index: number) => {
  if (el) {
    oscillatorRefs.value[index] = el;
  }
};
</script>

<template>
  <div class="dashboard">
    <div class="overlay-chart">
      <canvas ref="overlayRef" />
    </div>
    <div
      v-for="(indicator, index) in indicators.filter(
        i => i.listing.chartType === 'oscillator'
      )"
      :key="indicator.selection.ucid"
      class="oscillator-chart"
    >
      <canvas :ref="el => setOscillatorRef(el, index)" />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.overlay-chart {
  width: 100%;
  height: 400px;
}

.oscillator-chart {
  width: 100%;
  height: 200px;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>
```

## Data Loading Patterns

### 1. Static JSON files (build-time)

```typescript
// Load from JSON file at build time
import rawQuotes from "../data/quotes.json";
import { loadStaticQuotes } from "@stock-charts/financial";

const quotes = loadStaticQuotes(rawQuotes);
```

### 2. Fetch from API (runtime)

```vue
<script setup>
import { ref, onMounted } from "vue";
import { createApiClient } from "@stock-charts/financial";

const quotes = ref([]);

onMounted(async () => {
  const api = createApiClient({
    baseUrl: "https://api.example.com",
    onError: (context, error) => console.error(context, error)
  });

  quotes.value = await api.getQuotes();
});
</script>
```

### 3. Hybrid approach (static fallback)

```typescript
import staticQuotes from "../data/quotes.json";
import { loadStaticQuotes, createApiClient } from "@stock-charts/financial";

const quotes = ref(loadStaticQuotes(staticQuotes));

onMounted(async () => {
  try {
    const api = createApiClient({ baseUrl: "https://api.example.com" });
    quotes.value = await api.getQuotes();
  } catch (error) {
    // Fall back to static data already loaded
    console.warn("Using static data fallback", error);
  }
});
```

## SSR Considerations

### Always wrap charts in `<ClientOnly>`

Charts require a DOM canvas and cannot render during SSR:

```vue
<ClientOnly>
  <StockChart :quotes="quotes" />
</ClientOnly>
```

### Use dynamic imports in `onMounted`

Prevent Chart.js from loading during SSR:

```typescript
onMounted(async () => {
  // This only executes in the browser
  const { ChartManager } = await import("@stock-charts/financial");
  // ... use ChartManager
});
```

### Check for `window` before accessing browser APIs

```typescript
if (typeof window !== "undefined") {
  // Safe to use window, localStorage, etc.
}
```

## Configuration Options

### ChartManager options

```typescript
const manager = new ChartManager({
  settings: {
    isDarkTheme: false, // Light/dark mode
    showTooltips: true // Enable hover tooltips
  },
  extraBars: 7 // Padding bars on right edge (default: 7)
});
```

### Overlay chart customization

```typescript
// Initialize with specific bar count
manager.initializeOverlay(canvas, quotes, 250);

// Dynamically adjust visible bars (e.g., on window resize)
manager.setBarCount(500);

// Force resize
manager.resize();
```

## Responsive Design

### Auto-resize on window resize

```vue
<script setup>
import { onMounted, onBeforeUnmount } from 'vue'

let manager = null

const handleResize = () => {
  if (manager) {
    // Recalculate bar count based on chart width
    const container = document.querySelector('.stock-chart') ?? document.body;
    const chartWidth = container.getBoundingClientRect().width || container.clientWidth || window.innerWidth || 600;
    const barWidth = 6; // approximate bar width in pixels
    const newBarCount = Math.floor(chartWidth / barWidth);

    manager.setBarCount(newBarCount);
  }
}

onMounted(() => {
  // ... initialize manager

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (manager) {
    manager.destroy()
  }
})
</script>
```

## Complete Example

Full example at `.vitepress/components/FinancialDashboard.vue`:

```vue
<script setup lang="ts">
import { onMounted, ref, watch, onBeforeUnmount } from "vue";
import { useData } from "vitepress";

const { isDark } = useData();
const props = defineProps<{
  quotesUrl?: string;
  staticQuotes?: any[];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
let manager: any = null;

onMounted(async () => {
  try {
    const {
      registerFinancialCharts,
      ChartManager,
      createApiClient,
      loadStaticQuotes
    } = await import("@stock-charts/financial");

    registerFinancialCharts();

    // Load quotes
    let quotes;
    if (props.quotesUrl) {
      const api = createApiClient({
        baseUrl: props.quotesUrl,
        onError: (ctx, err) => console.error(ctx, err)
      });
      quotes = await api.getQuotes();
    } else if (props.staticQuotes) {
      quotes = loadStaticQuotes(props.staticQuotes);
    } else {
      throw new Error("No quotes data provided");
    }

    // Initialize chart
    manager = new ChartManager({
      settings: {
        isDarkTheme: isDark.value,
        showTooltips: true
      }
    });

    if (canvasRef.value) {
      manager.initializeOverlay(canvasRef.value, quotes, 250);
    }

    loading.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to load chart";
    loading.value = false;
  }
});

watch(isDark, dark => {
  if (manager) {
    manager.updateTheme({
      isDarkTheme: dark,
      showTooltips: true
    });
  }
});

onBeforeUnmount(() => {
  if (manager) {
    manager.destroy();
  }
});
</script>

<template>
  <div class="financial-dashboard">
    <div v-if="loading" class="loading">Loading chart...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="chart-container">
      <canvas ref="canvasRef" />
    </div>
  </div>
</template>

<style scoped>
.financial-dashboard {
  width: 100%;
  min-height: 400px;
  margin: 2rem 0;
}

.chart-container {
  width: 100%;
  height: 400px;
}

canvas {
  width: 100%;
  height: 100%;
}

.loading,
.error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--vp-c-text-2);
}

.error {
  color: var(--vp-c-danger);
}
</style>
```

## Troubleshooting

### Chart not rendering

1. Ensure `<ClientOnly>` wrapper is used
2. Verify `registerFinancialCharts()` is called before creating charts
3. Check that canvas element is mounted before initializing

### SSR errors

```text
ReferenceError: document is not defined
```

**Solution**: Use dynamic imports in `onMounted()`

### Theme not updating

**Solution**: Ensure `watch(isDark, ...)` is set up to call `manager.updateTheme()`

### Canvas sizing issues

**Solution**: Set explicit height on parent container, ensure canvas has `width: 100%; height: 100%;`

## Performance Tips

1. **Limit bar count** for large datasets (250-500 bars recommended)
2. **Destroy charts** in `onBeforeUnmount()` to prevent memory leaks
3. **Debounce resize handlers** to avoid excessive redraws
4. **Use static data** when possible to avoid API calls on every page load

## TypeScript Support

All types are exported from the main package:

```typescript
import type {
  ChartSettings,
  Quote,
  IndicatorListing,
  IndicatorSelection,
  ChartManagerConfig
} from "@stock-charts/financial";
```

## Further Reading

- [@stock-charts/financial README](../README.md) - Complete API reference
- [Chart.js Documentation](https://www.chartjs.org/docs/latest/) - Underlying chart library
- [VitePress Guide](https://vitepress.dev/guide/what-is-vitepress) - VitePress fundamentals
