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
  loadStaticIndicatorData,
  setupIndyCharts,
  type IndicatorListing,
  type IndicatorSelection
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
manager.initializeOverlay(document.getElementById("main-chart") as HTMLCanvasElement, quotes, 250);

function defaultSelection(listing: IndicatorListing): IndicatorSelection {
  return {
    ucid: crypto.randomUUID(),
    uiid: listing.uiid,
    label: listing.legendTemplate,
    chartType: listing.chartType,
    params: listing.parameters?.map(param => ({
      paramName: param.paramName,
      displayName: param.displayName,
      minimum: param.minimum,
      maximum: param.maximum,
      value: param.defaultValue
    })) ?? [],
    results: listing.results.map(result => ({
      label: result.tooltipTemplate,
      displayName: result.displayName,
      dataName: result.dataName,
      color: result.defaultColor,
      lineType: result.lineType,
      lineWidth: result.lineWidth ?? 2,
      order: listing.order,
      dataset: { type: "line", data: [] } as never
    }))
  };
}

const emaListing = listings.find(x => x.uiid === "EMA");
const rsiListing = listings.find(x => x.uiid === "RSI");
if (!emaListing || !rsiListing) throw new Error("Required indicators not available");

const emaSelection = defaultSelection(emaListing);
const emaLookback = emaSelection.params.find(p => p.paramName === "lookbackPeriods");
if (emaLookback) emaLookback.value = 20;

const emaRows = loadStaticIndicatorData(await client.getSelectionData(emaSelection, emaListing));
manager.processSelectionData(emaSelection, emaListing, emaRows);
manager.displaySelection(emaSelection, emaListing);

const rsiSelection = defaultSelection(rsiListing);
const rsiRows = loadStaticIndicatorData(await client.getSelectionData(rsiSelection, rsiListing));
manager.processSelectionData(rsiSelection, rsiListing, rsiRows);
manager.displaySelection(rsiSelection, rsiListing);

manager.createOscillator(
  document.getElementById("rsi-chart") as HTMLCanvasElement,
  rsiSelection,
  rsiListing
);
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
const macdSelection = defaultSelection(macdListing);

// Override the defaults using the parameter names provided by the listing
for (const param of macdSelection.params) {
  if (param.paramName.toLowerCase().includes("fast")) param.value = 12;
  if (param.paramName.toLowerCase().includes("slow")) param.value = 26;
  if (param.paramName.toLowerCase().includes("signal")) param.value = 9;
}

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
const rsiCanvas = document.getElementById("rsi-chart");
const macdCanvas = document.getElementById("macd-chart");

// Process data for each selection
manager.processSelectionData(rsiSelection, rsiListing, rsiData);
manager.processSelectionData(macdSelection, macdListing, macdData);
manager.displaySelection(rsiSelection, rsiListing);
manager.displaySelection(macdSelection, macdListing);

// Create oscillator charts with the canvas elements
const rsiOscillator = manager.createOscillator(
  rsiCanvas as HTMLCanvasElement,
  rsiSelection,
  rsiListing
);
const macdOscillator = manager.createOscillator(
  macdCanvas as HTMLCanvasElement,
  macdSelection,
  macdListing
);
```

## Next Steps

- Learn about [multiple charts](/examples/multiple)
- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
