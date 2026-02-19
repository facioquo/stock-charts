# Quick Start

This guide will help you create your first financial chart in minutes.

## Step 1: HTML Setup

Create a basic HTML structure with canvas elements:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Chart</title>
    <style>
      .chart-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      canvas {
        width: 100%;
        height: 400px;
      }
    </style>
  </head>
  <body>
    <div class="chart-container">
      <h1>Stock Chart</h1>
      <canvas id="main-chart"></canvas>
      <canvas id="volume-chart"></canvas>
    </div>

    <script type="module" src="/main.js"></script>
  </body>
</html>
```

## Step 2: Initialize Chart.js

Register Chart.js components and financial chart types:

```typescript
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import { registerFinancialCharts } from "@facioquo/chartjs-chart-financial";

// Register all Chart.js components
Chart.register(...registerables, annotationPlugin);

// Register financial chart types
registerFinancialCharts();
```

## Step 3: Create Chart Manager

Set up the chart manager with your canvas elements:

```typescript
import { ChartManager, loadStaticQuotes } from "@facioquo/indy-charts";

// Get canvas elements
const mainCanvas = document.getElementById("main-chart") as HTMLCanvasElement;
const volumeCanvas = document.getElementById(
  "volume-chart"
) as HTMLCanvasElement;

// Create chart manager
const manager = new ChartManager({
  mainCanvas,
  volumeCanvas
  // API client is optional - we'll use static data for this example
});
```

## Step 4: Load Data and Render

Load stock data and render the charts:

```typescript
// Load sample data (for production, use an API client)
const quotes = await loadStaticQuotes("AAPL");

// Set quotes in the manager
manager.setQuotes(quotes);

// Render charts
manager.renderMainChart("candlestick");
manager.renderVolumeChart();
```

## Complete Example

Here's the full code:

```typescript
import { Chart, registerables } from "chart.js";
import "chartjs-adapter-date-fns";
import annotationPlugin from "chartjs-plugin-annotation";
import { registerFinancialCharts } from "@facioquo/chartjs-chart-financial";
import { ChartManager, loadStaticQuotes } from "@facioquo/indy-charts";

// Register Chart.js
Chart.register(...registerables, annotationPlugin);
registerFinancialCharts();

// Initialize
const mainCanvas = document.getElementById("main-chart") as HTMLCanvasElement;
const volumeCanvas = document.getElementById(
  "volume-chart"
) as HTMLCanvasElement;

const manager = new ChartManager({
  mainCanvas,
  volumeCanvas
});

// Load and render
const quotes = await loadStaticQuotes("AAPL");
manager.setQuotes(quotes);
manager.renderMainChart("candlestick");
manager.renderVolumeChart();
```

## What's Next?

- See [basic example](/examples/) for a working demo
- Learn about [indicators](/examples/indicators)
- Explore [multiple charts](/examples/multiple)
- Read about [API client configuration](/guide/api-client)
