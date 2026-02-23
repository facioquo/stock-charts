# Basic Chart Example

A simple candlestick chart with volume.

## Live Demo

> **Requires API**: Renders live data from `https://localhost:5001`. Start the Web API with `cd server/WebApi && dotnet run`.

<script setup>
import { onMounted, ref } from 'vue';
import { setupIndyCharts, createApiClient, OverlayChart } from '@facioquo/indy-charts';

const canvasRef = ref(null);
const errorMsg = ref('');

onMounted(async () => {
  // One-time setup: registers Chart.js, financial chart types, and date adapter
  setupIndyCharts();

  const client = createApiClient({
    baseUrl: 'https://localhost:5001',
    onError: (_ctx, _err) => {
      errorMsg.value = 'Unable to load data — start the Web API: cd server/WebApi && dotnet run';
    }
  });

  try {
    const quotes = await client.getQuotes();
    const chart = new OverlayChart(canvasRef.value, {
      isDarkTheme: false,
      showTooltips: true
    });
    // Render the last 250 bars (price candlesticks + volume in one canvas)
    chart.render(quotes.slice(-250));
  } catch {
    errorMsg.value = 'Unable to load data — start the Web API: cd server/WebApi && dotnet run';
  }
});
</script>

<div style="max-width: 1000px; margin: 20px auto;">
  <div
    v-if="errorMsg"
    style="padding: 12px; background: #fef3c7; border: 1px solid #d97706; border-radius: 6px; color: #92400e; font-size: 14px;"
  >
    ⚠️ {{ errorMsg }}
  </div>
  <canvas v-else ref="canvasRef" style="width: 100%; height: 450px;"></canvas>
</div>

## Source Code

```vue
<script setup>
import { onMounted, ref } from "vue";
import { setupIndyCharts, createApiClient, OverlayChart } from "@facioquo/indy-charts";

const canvasRef = ref(null);
const errorMsg = ref("");

onMounted(async () => {
  // One-time setup: registers Chart.js, financial chart types, and date adapter
  setupIndyCharts();

  const client = createApiClient({
    baseUrl: "https://localhost:5001",
    onError: (_ctx, _err) => {
      errorMsg.value = "API unavailable";
    }
  });

  const quotes = await client.getQuotes();
  const chart = new OverlayChart(canvasRef.value, {
    isDarkTheme: false,
    showTooltips: true
  });

  // Render the last 250 bars (price candlesticks + volume in one canvas)
  chart.render(quotes.slice(-250));
});
</script>

<template>
  <div v-if="errorMsg">{{ errorMsg }}</div>
  <canvas v-else ref="canvasRef" style="width: 100%; height: 450px;"></canvas>
</template>
```

## Key Points

1. **One-time setup**: `setupIndyCharts()` registers Chart.js, financial chart types, and the date adapter — call it once before creating any charts
2. **API client**: `createApiClient({ baseUrl })` provides typed access to the REST API
3. **OverlayChart**: Renders price candlesticks and volume bars on a single canvas with dual y-axes
4. **Bar count**: `quotes.slice(-250)` limits the display to the most recent 250 bars

## Next Steps

- Add [technical indicators](/examples/indicators)
- Create [multiple charts](/examples/multiple)
- Use [real API data](/guide/api-client)
