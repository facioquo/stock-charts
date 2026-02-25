# Multiple Charts

Example showing how to manage multiple independent charts.

## Overview

This example demonstrates:

- Creating multiple chart managers
- Reusing one quote source across views
- Coordinating chart window sizes in application code

## Status

This page is currently a **recipe page** (code example only), not a live
embedded demo. The code below uses real `@facioquo/indy-charts` APIs.

## Basic Multiple Charts

```typescript
import { ChartManager, createApiClient, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
const client = createApiClient({ baseUrl: "https://localhost:5001" });
const quotes = await client.getQuotes();

const settings = { isDarkTheme: false, showTooltips: true };
const manager1 = new ChartManager({
  settings
});
const manager2 = new ChartManager({
  settings
});

manager1.initializeOverlay(
  document.getElementById("chart1-main") as HTMLCanvasElement,
  quotes,
  250
);

manager2.initializeOverlay(
  document.getElementById("chart2-main") as HTMLCanvasElement,
  quotes,
  120
);
```

## HTML Layout

```html
<div class="charts-grid">
  <div class="chart-panel">
    <h2>Longer Window (250 bars)</h2>
    <canvas id="chart1-main"></canvas>
  </div>

  <div class="chart-panel">
    <h2>Shorter Window (120 bars)</h2>
    <canvas id="chart2-main"></canvas>
  </div>
</div>

<style>
  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    padding: 20px;
  }

  .chart-panel {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 15px;
  }

  canvas {
    width: 100%;
    margin-bottom: 10px;
  }
</style>
```

## Chart Comparison

Create a side-by-side comparison with a shared quote source and different
window sizes:

```typescript
const quotes = await client.getQuotes();
const windows = [250, 120, 60];

const managers = windows.map((barCount, index) => {
  const manager = new ChartManager({ settings });
  manager.initializeOverlay(
    document.getElementById(`chart${index}-main`) as HTMLCanvasElement,
    quotes,
    barCount
  );
  return manager;
});
```

## Coordinated Window Changes (Application-Level)

`ChartManager` does not provide built-in synchronized zoom events. Coordinate
window changes in your app by applying `setBarCount()` to each instance:

```typescript
const managers = [manager1, manager2, manager3];

function applyWindow(barCount: number) {
  managers.forEach(manager => manager.setBarCount(barCount));
}

applyWindow(180);
```

## Performance Considerations

When managing multiple charts:

1. **Lazy Loading**: Create charts only when visible
2. **Virtual Scrolling**: For large grids of charts
3. **Debounce Updates**: Batch data updates
4. **Destroy Unused**: Clean up charts when switching views

```typescript
managers.forEach(manager => manager.destroy());
```

## Next Steps

- Learn about [installation](/guide/installation)
- Read the [quick-start guide](/guide/quick-start)
- Return to [guide index](/guide/)
