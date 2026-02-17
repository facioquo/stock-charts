# Multiple Charts

Example showing how to manage multiple independent charts.

## Overview

This example demonstrates:
- Creating multiple chart managers
- Comparing different stocks
- Synchronizing chart interactions

## Basic Multiple Charts

```typescript
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { registerFinancialCharts } from '@facioquo/chartjs-chart-financial';
import { ChartManager, loadStaticQuotes } from '@facioquo/indy-charts';

// Register components
Chart.register(...registerables, annotationPlugin);
registerFinancialCharts();

// Create first chart manager
const manager1 = new ChartManager({
  mainCanvas: document.getElementById('chart1-main'),
  volumeCanvas: document.getElementById('chart1-volume')
});

// Create second chart manager
const manager2 = new ChartManager({
  mainCanvas: document.getElementById('chart2-main'),
  volumeCanvas: document.getElementById('chart2-volume')
});

// Load different stocks
const aaplQuotes = await loadStaticQuotes('AAPL');
const msftQuotes = await loadStaticQuotes('MSFT');

// Render charts
manager1.setQuotes(aaplQuotes);
manager1.renderMainChart('candlestick');
manager1.renderVolumeChart();

manager2.setQuotes(msftQuotes);
manager2.renderMainChart('candlestick');
manager2.renderVolumeChart();
```

## HTML Layout

```html
<div class="charts-grid">
  <div class="chart-panel">
    <h2>AAPL</h2>
    <canvas id="chart1-main"></canvas>
    <canvas id="chart1-volume"></canvas>
  </div>
  
  <div class="chart-panel">
    <h2>MSFT</h2>
    <canvas id="chart2-main"></canvas>
    <canvas id="chart2-volume"></canvas>
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

Create a side-by-side comparison with synchronized date ranges:

```typescript
// Load quotes for multiple symbols
const quotes = await Promise.all([
  loadStaticQuotes('AAPL'),
  loadStaticQuotes('MSFT'),
  loadStaticQuotes('GOOGL')
]);

// Find common date range
const startDate = Math.max(...quotes.map(q => q[0].date));
const endDate = Math.min(...quotes.map(q => q[q.length - 1].date));

// Filter quotes to common range
const filteredQuotes = quotes.map(q => 
  q.filter(quote => quote.date >= startDate && quote.date <= endDate)
);

// Create and render charts
const managers = filteredQuotes.map((quotes, index) => {
  const manager = new ChartManager({
    mainCanvas: document.getElementById(`chart${index}-main`),
    volumeCanvas: document.getElementById(`chart${index}-volume`)
  });
  
  manager.setQuotes(quotes);
  manager.renderMainChart('candlestick');
  manager.renderVolumeChart();
  
  return manager;
});
```

## Synchronized Zooming

Synchronize zoom/pan across multiple charts:

```typescript
// Array of chart managers
const managers = [manager1, manager2, manager3];

// Listen to zoom events on first chart
manager1.onZoom((minDate, maxDate) => {
  // Apply same zoom to other charts
  managers.slice(1).forEach(manager => {
    manager.setDateRange(minDate, maxDate);
  });
});
```

## Dynamic Updates

Update all charts when new data arrives:

```typescript
async function updateAllCharts() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL'];
  
  const updates = await Promise.all(
    symbols.map(symbol => loadStaticQuotes(symbol))
  );
  
  managers.forEach((manager, index) => {
    manager.setQuotes(updates[index]);
    manager.refresh();
  });
}

// Update every 5 minutes
setInterval(updateAllCharts, 5 * 60 * 1000);
```

## Performance Considerations

When managing multiple charts:

1. **Lazy Loading**: Create charts only when visible
2. **Virtual Scrolling**: For large grids of charts
3. **Debounce Updates**: Batch data updates
4. **Destroy Unused**: Clean up charts when switching views

```typescript
// Destroy when no longer needed
manager.destroy();
```

## Next Steps

- Learn about [API client](/guide/api-client)
- Explore [chart customization](/guide/customization)
- See [performance tips](/guide/performance)
