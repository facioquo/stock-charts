# Charts with Indicators

Example showing how to add technical indicators to charts.

## Overview

This example demonstrates:

- Adding EMA/SMA-style overlay indicators
- Adding RSI (Relative Strength Index) oscillator
- Customizing indicator parameters

## Live Demo

> **Requires full stack demo services**: Start the Web API (and supporting services) with the VS Code task `Run: VitePress chart demo full stack`.

<ClientOnly>
  <IndyIndicatorsDemo />
</ClientOnly>

## ChartManager Recipe (Real API)

```typescript
import {
  createApiClient,
  ChartManager,
  createDefaultSelection,
  loadStaticIndicatorData,
  setupIndyCharts
} from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({ baseUrl: "https://localhost:5001" });
const [quotes, listings] = await Promise.all([client.getQuotes(), client.getListings()]);

const manager = new ChartManager({
  settings: {
    isDarkTheme: false,
    showTooltips: true
  }
});

const mainCanvas = document.getElementById("main-chart") as HTMLCanvasElement | null;
const rsiCanvas = document.getElementById("rsi-chart") as HTMLCanvasElement | null;
if (!mainCanvas || !rsiCanvas) throw new Error("Required canvas elements not found");

manager.initializeOverlay(mainCanvas, quotes, 250);

const emaListing = listings.find(x => x.uiid === "EMA");
const rsiListing = listings.find(x => x.uiid === "RSI");
if (!emaListing || !rsiListing) throw new Error("Required indicators not available");

// Use the library helper to hydrate defaults, then override parameters as needed.
const emaSelection = createDefaultSelection(emaListing, { lookbackPeriods: 20 });

const emaRows = loadStaticIndicatorData(await client.getSelectionData(emaSelection, emaListing));
manager.processSelectionData(emaSelection, emaListing, emaRows);
manager.displaySelection(emaSelection, emaListing);

const rsiSelection = createDefaultSelection(rsiListing);
const rsiRows = loadStaticIndicatorData(await client.getSelectionData(rsiSelection, rsiListing));
manager.processSelectionData(rsiSelection, rsiListing, rsiRows);
manager.displaySelection(rsiSelection, rsiListing);

manager.createOscillator(rsiCanvas, rsiSelection, rsiListing);
```

## Available Indicators

### Overlay Indicators

Displayed on the main price chart:

- **SMA**: Simple Moving Average
- **EMA**: Exponential Moving Average
- **Bollinger Bands**: Volatility bands
- **VWAP**: Volume Weighted Average Price

### Oscillator Indicators

Displayed in separate chart below:

- **RSI**: Relative Strength Index (0-100)
- **MACD**: Moving Average Convergence Divergence
- **Stochastic**: Stochastic oscillator
- **CCI**: Commodity Channel Index

## Indicator Parameters

Indicator parameters are supplied through `IndicatorSelection.params`, then
submitted with `client.getSelectionData(selection, listing)`:

```typescript
// macdListing is resolved from listings (see recipe above)
// createDefaultSelection accepts parameter overrides keyed by paramName
const macdSelection = createDefaultSelection(macdListing, {
  fastPeriods: 12,
  slowPeriods: 26,
  signalPeriods: 9
});

const rawMacd = await client.getSelectionData(macdSelection, macdListing);
const macdRows = loadStaticIndicatorData(rawMacd);
```

## Notes

- The live demo above uses `ChartManager` with one overlay chart and two oscillator charts.
- This page intentionally demonstrates real library method flow (`initializeOverlay`, `processSelectionData`, `displaySelection`, `createOscillator`) instead of simplified pseudo APIs.

## Multiple Oscillators

Display multiple oscillators:

```typescript
// Create additional canvas elements
const rsiCanvas = document.getElementById("rsi-chart") as HTMLCanvasElement | null;
const macdCanvas = document.getElementById("macd-chart") as HTMLCanvasElement | null;
if (!rsiCanvas || !macdCanvas) throw new Error("Canvas elements not found");

// Load data for each selection (ensure these are available before processing)
const rsiData = loadStaticIndicatorData(await client.getSelectionData(rsiSelection, rsiListing));
const macdData = loadStaticIndicatorData(await client.getSelectionData(macdSelection, macdListing));

// Process data for each selection
manager.processSelectionData(rsiSelection, rsiListing, rsiData);
manager.processSelectionData(macdSelection, macdListing, macdData);
manager.displaySelection(rsiSelection, rsiListing);
manager.displaySelection(macdSelection, macdListing);

// Create oscillator charts with the canvas elements
const rsiOscillator = manager.createOscillator(
  rsiCanvas,
  rsiSelection,
  rsiListing
);
const macdOscillator = manager.createOscillator(
  macdCanvas,
  macdSelection,
  macdListing
);
```

## Next Steps

- Learn about [multiple charts](/examples/multiple)
- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
