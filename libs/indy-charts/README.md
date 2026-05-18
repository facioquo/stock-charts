# @facioquo/indy-charts

Framework-agnostic financial charting library with technical indicators and stock market data visualization built on Chart.js.

## Installation

```bash
npm install @facioquo/indy-charts chart.js chartjs-plugin-annotation vue
```

## Quick Start

```typescript
import { createApiClient, OverlayChart, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({
  baseUrl: "https://api.example.com"
});

const quotes = await client.getQuotes();

const canvas = document.getElementById("main-chart");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Chart canvas not found");
}

const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true
});

chart.render(quotes.slice(-250));
```

## Usage with Vue

Register the optional Vue adapter once in your app entry point (e.g. `.vitepress/theme/index.ts` for VitePress, or `main.ts` for plain Vue):

```typescript
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: true },
      indicators: {
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
```

Then use the global component from Markdown:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

## License

Apache-2.0 License - see the repository LICENSE file for details.

## Related projects

- [facioquo/stock-charts](https://github.com/facioquo/stock-charts) - website demonstrating use of `@facioquo/indy-charts` and NuGet `Skender.Stock.Indicators`
