# Oscillator chart

Oscillator indicators (RSI, MACD, Stochastic, etc.) render as a standalone chart — no price chart required by default. Add `:with-overlay="true"` to pair them with the candlestick + volume overlay.

## Standalone oscillator

<ClientOnly>
  <StockIndicatorChart indicator="rsi" id="rsi-standalone" />
</ClientOnly>

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

> [!tip]
> Add `id` prop for stable element identification in testing: `<StockIndicatorChart indicator="rsi" id="rsi-1" />`. This is optional but recommended for Playwright/E2E tests.

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

const manager = new ChartManager({
  settings: {
    isDarkTheme: false,
    showTooltips: true,
    showRightAxisLabels: false // Cleaner look for standalone oscillators
  }
});

// Standalone oscillator: skip initializeOverlay, render straight into the oscillator canvas.
const canvas = document.getElementById("rsi-chart") as HTMLCanvasElement;
manager.processSelectionData(selection, listing, rows);
manager.displaySelection(selection, listing);
manager.createOscillator(canvas, selection, listing);
```

:::

## Oscillator paired with price chart

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" id="rsi-with-overlay" />
</ClientOnly>

When paired, you need **two canvases** — one for the price/volume overlay and one for the oscillator panel below it.

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

> [!tip]
> Add `id` prop for stable element identification in testing: `<StockIndicatorChart indicator="rsi" :with-overlay="true" id="rsi-overlay" />`. This is optional but recommended for Playwright/E2E tests.

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

const manager = new ChartManager({
  settings: {
    isDarkTheme: false,
    showTooltips: true,
    showRightAxisLabels: true // Show axis labels when paired with price chart
  }
});
manager.initializeOverlay(priceCanvas, quotes, 250);
manager.processSelectionData(selection, listing, rows);
manager.displaySelection(selection, listing);
manager.createOscillator(rsiCanvas, selection, listing);
```

:::

## Overlay indicator + companion oscillator (aligned)

Compose an **overlay indicator on the price panel** with its **companion oscillator** beneath it — in a single, vertically aligned chart — by adding the `with` prop. Both indicators share one `ChartManager`, so the oscillator's x-axis lines up with the price panel above it.

<ClientOnly>
  <StockIndicatorChart indicator="bb" with="bbPctB" id="bb-combo" />
</ClientOnly>

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="bb" with="bbPctB" />
</ClientOnly>
```

> [!tip]
> `with` accepts a single indicator name or an array (`:with="['bbPctB', 'rsi']"`). Overlay-type companions render on the price panel; oscillator-type companions each get an aligned pane beneath it.

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

const bbListing = listings.find(l => l.uiid === "BB")!;
const pctbListing = listings.find(l => l.uiid === "BB-PCTB")!;
const bb = createDefaultSelection(bbListing, { lookbackPeriods: 20, standardDeviations: 2 });
const pctb = createDefaultSelection(pctbListing, { lookbackPeriods: 20, standardDeviations: 2 });

const priceCanvas = document.getElementById("price-chart") as HTMLCanvasElement;
const pctbCanvas = document.getElementById("pctb-chart") as HTMLCanvasElement;

const manager = new ChartManager({
  settings: {
    isDarkTheme: false,
    showTooltips: true,
    showRightAxisLabels: true // Show axis labels for aligned multi-panel charts
  }
});

// One manager drives both panels so they share the windowed x-axis.
manager.initializeOverlay(priceCanvas, quotes, 250);

// Bands render on the price panel.
manager.processSelectionData(bb, bbListing, loadStaticIndicatorData(await api.getSelectionData(bb, bbListing)));
manager.displaySelection(bb, bbListing);

// %B renders in an aligned oscillator pane below.
manager.processSelectionData(pctb, pctbListing, loadStaticIndicatorData(await api.getSelectionData(pctb, pctbListing)));
manager.displaySelection(pctb, pctbListing);
manager.createOscillator(pctbCanvas, pctb, pctbListing);
```

:::

> [!warning] Alignment contract
> X-axis alignment is only guaranteed when both panels are driven by **one** component (or one `ChartManager`). Stacking two **separate** `<StockIndicatorChart>` instances does not link their x-axis geometry — a standalone oscillator auto-ranges to its own data independently of any sibling chart. Use `with` (or `:with-overlay="true"`) to keep panels aligned.

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
- **Right-axis labels**: control whether mirrored tick labels render on the right side of charts via the `showRightAxisLabels` setting (defaults to `true`). Set to `false` for a cleaner look in standalone oscillators or documentation examples. Gridlines remain visible regardless of this setting.

## Next steps

- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
- Reference the [API client](/reference/api-client)
