# Oscillator chart

Oscillator indicators (RSI, MACD, Stochastic, etc.) render as a standalone chart — no price chart required by default. Add `:with-overlay="true"` to pair them with the candlestick + volume overlay.

## Standalone oscillator

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :config="{ id: 'rsi-standalone' }" />
</ClientOnly>

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

```html [Plain HTML]
<canvas id="rsi-chart"></canvas>
```

```typescript [Plain TypeScript]
import {
  ChartManager,
  createApiClient,
  createDefaultSelection,
  loadStaticIndicatorData,
  setupIndyCharts
} from "@facioquo/indy-charts";

setupIndyCharts();

const api = createApiClient({ baseUrl: "https://api.example.com" });
const [quotes, listings] = await Promise.all([api.getQuotes(), api.getListings()]);

const listing = listings.find(l => l.uiid === "RSI")!;
const selection = createDefaultSelection(listing, { lookbackPeriods: 14 });
const rows = loadStaticIndicatorData(await api.getSelectionData(selection, listing));

const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });

// Standalone oscillator: skip initializeOverlay, render straight into the oscillator canvas.
const canvas = document.getElementById("rsi-chart") as HTMLCanvasElement;
manager.processSelectionData(selection, listing, rows);
manager.displaySelection(selection, listing);
manager.createOscillator(canvas, selection, listing);
```

:::

## Oscillator paired with price chart

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" :config="{ id: 'rsi-with-overlay' }" />
</ClientOnly>

When paired, you need **two canvases** — one for the price/volume overlay and one for the oscillator panel below it.

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

```html [Plain HTML]
<canvas id="price-chart"></canvas>
<canvas id="rsi-chart"></canvas>
```

```typescript [Plain TypeScript]
import {
  ChartManager,
  createApiClient,
  createDefaultSelection,
  loadStaticIndicatorData,
  setupIndyCharts
} from "@facioquo/indy-charts";

setupIndyCharts();

const api = createApiClient({ baseUrl: "https://api.example.com" });
const [quotes, listings] = await Promise.all([api.getQuotes(), api.getListings()]);

const listing = listings.find(l => l.uiid === "RSI")!;
const selection = createDefaultSelection(listing, { lookbackPeriods: 14 });
const rows = loadStaticIndicatorData(await api.getSelectionData(selection, listing));

const priceCanvas = document.getElementById("price-chart") as HTMLCanvasElement;
const rsiCanvas = document.getElementById("rsi-chart") as HTMLCanvasElement;

const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });
manager.initializeOverlay(priceCanvas, quotes, 250);
manager.processSelectionData(selection, listing, rows);
manager.displaySelection(selection, listing);
manager.createOscillator(rsiCanvas, selection, listing);
```

:::

## Custom parameters

Use the `config` prop to override registered indicator parameters:

```vue
<ClientOnly>
  <StockIndicatorChart
    indicator="rsi"
    :config="{ params: { lookbackPeriods: 21 }, results: ['rsi'] }"
  />
</ClientOnly>
```

For plain TypeScript, pass the same param overrides directly into `createDefaultSelection`:

```typescript
const selection = createDefaultSelection(listing, { lookbackPeriods: 21 });
```

## Notes

- Oscillators render **standalone by default**. Add `:with-overlay="true"` (or call `initializeOverlay` in plain TS) to pair with the price chart.
- The Vue version requires the indicator to be registered in `setupIndyChartsForVue`. The plain version looks up the listing from `getListings()` at runtime.
- Charts automatically respect your site's dark/light theme preference.

## Next steps

- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
- Reference the [API client](/reference/api-client)
