# Overlay chart

A candlestick price chart with volume and an EMA overlay.

## Live demo

<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>

## Source code

::: code-group

```vue [Vue / VitePress]
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

```html [Plain HTML]
<canvas id="overlay-chart"></canvas>
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

const listing = listings.find(l => l.uiid === "EMA")!;
const selection = createDefaultSelection(listing, { lookbackPeriods: 20 });
const rows = loadStaticIndicatorData(await api.getSelectionData(selection, listing));

const canvas = document.getElementById("overlay-chart") as HTMLCanvasElement;
const manager = new ChartManager({ settings: { isDarkTheme: false, showTooltips: true } });
manager.initializeOverlay(canvas, quotes, 250);
manager.processSelectionData(selection, listing, rows);
manager.displaySelection(selection, listing);
```

:::

The `<StockIndicatorChart>` component is a thin Vue wrapper around `ChartManager`. Under the hood it renders the same `<canvas>` shown above. Use the plain version when you're not on Vue, or when you want full control over the chart lifecycle.

::: tip Indicator registration
The Vue version assumes `ema` was registered when you called `setupIndyChartsForVue` in your theme file:

```typescript
setupIndyChartsForVue(app, {
  api: { baseUrl: "https://api.example.com" },
  indicators: {
    ema: { uiid: "EMA", title: "EMA(20)", params: { lookbackPeriods: 20 } }
  }
});
```

:::

## Key points

1. **Interactive demo**: charts update in real-time and respond to theme changes
2. **Overlay indicator**: EMA is plotted on the price chart alongside volume bars
3. **One canvas**: the price, volume, and overlay indicator all share the same `<canvas>` element

## Next steps

- Add [technical indicators](/examples/indicators)
- Supply your own [custom data](/examples/custom-data)
- Read the [quick-start guide](/guide/quick-start)
