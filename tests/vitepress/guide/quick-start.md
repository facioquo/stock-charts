# Quick Start

This guide will help you create your first financial chart in minutes.

## Step 1: HTML Setup

Create a basic HTML structure with a single canvas element (the overlay chart
renders both price and volume):

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
      <canvas id="price-chart"></canvas>
    </div>

    <script type="module" src="/main.js"></script>
  </body>
</html>
```

## Step 2: Initialize Chart.js

Initialize the library once (this registers Chart.js components, financial chart
types, the annotation plugin, and the date adapter):

```typescript
import { setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();
```

## Step 3: Create API Client and Chart

Create the API client and an `OverlayChart` instance:

```typescript
import { createApiClient, OverlayChart } from "@facioquo/indy-charts";

const canvas = document.getElementById("price-chart") as HTMLCanvasElement;

const client = createApiClient({
  baseUrl: "https://localhost:5001",
  onError: (context, error) => {
    console.error(context, error);
  }
});

const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true
});
```

## Step 4: Load Data and Render

Load quotes from the API and render the last 250 bars:

```typescript
const quotes = await client.getQuotes();
chart.render(quotes.slice(-250));
```

## Complete Example

Here's the full code:

```typescript
import { createApiClient, OverlayChart, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const canvas = document.getElementById("price-chart") as HTMLCanvasElement;
const client = createApiClient({ baseUrl: "https://localhost:5001" });

const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true
});

const quotes = await client.getQuotes();
chart.render(quotes.slice(-250));
```

## What's Next?

- See [basic example](/examples/) for a working demo
- Learn about [indicators](/examples/indicators)
- Explore [multiple charts](/examples/multiple)
- Read about [API client configuration](/guide/api-client)
