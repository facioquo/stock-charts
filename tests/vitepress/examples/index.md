# Basic Chart Example

A simple candlestick chart with volume.

## Live Demo

<script setup>
import { onMounted, ref } from 'vue';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { registerFinancialCharts } from '@facioquo/chartjs-chart-financial';
import { ChartManager, loadStaticQuotes } from '@facioquo/indy-charts';

const mainCanvasRef = ref(null);
const volumeCanvasRef = ref(null);

onMounted(async () => {
  // Register Chart.js components
  Chart.register(...registerables, annotationPlugin);
  registerFinancialCharts();

  // Create chart manager
  const manager = new ChartManager({
    mainCanvas: mainCanvasRef.value,
    volumeCanvas: volumeCanvasRef.value
  });

  // Load sample data
  const quotes = await loadStaticQuotes('AAPL');
  manager.setQuotes(quotes);

  // Render charts
  manager.renderMainChart('candlestick');
  manager.renderVolumeChart();
});
</script>

<div style="max-width: 1000px; margin: 20px auto;">
  <canvas ref="mainCanvasRef" style="width: 100%; height: 400px;"></canvas>
  <canvas ref="volumeCanvasRef" style="width: 100%; height: 150px; margin-top: 10px;"></canvas>
</div>

## Source Code

```vue
<script setup>
import { onMounted, ref } from 'vue';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { registerFinancialCharts } from '@facioquo/chartjs-chart-financial';
import { ChartManager, loadStaticQuotes } from '@facioquo/indy-charts';

const mainCanvasRef = ref(null);
const volumeCanvasRef = ref(null);

onMounted(async () => {
  Chart.register(...registerables, annotationPlugin);
  registerFinancialCharts();

  const manager = new ChartManager({
    mainCanvas: mainCanvasRef.value,
    volumeCanvas: volumeCanvasRef.value
  });

  const quotes = await loadStaticQuotes('AAPL');
  manager.setQuotes(quotes);

  manager.renderMainChart('candlestick');
  manager.renderVolumeChart();
});
</script>

<template>
  <div class="chart-container">
    <canvas ref="mainCanvasRef"></canvas>
    <canvas ref="volumeCanvasRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  max-width: 1000px;
  margin: 20px auto;
}
canvas {
  width: 100%;
}
</style>
```

## Key Points

1. **Register Components**: Always register Chart.js and financial charts before creating charts
2. **Canvas Elements**: Use refs to access canvas elements in Vue
3. **Static Data**: `loadStaticQuotes()` provides sample data for demos
4. **ChartManager**: Simplifies multi-chart management

## Customization

You can customize the chart appearance:

```typescript
manager.renderMainChart('candlestick', {
  theme: 'dark',
  title: 'AAPL Stock Price'
});
```

## Next Steps

- Add [technical indicators](/examples/indicators)
- Create [multiple charts](/examples/multiple)
- Use [real API data](/guide/api-client)
