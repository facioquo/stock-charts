# Installation

Install the library, then verify it works with a minimal chart. The full step-by-step lives in [Quick start](/guide/quick-start).

## Prerequisites

- **Node.js 24+** for tooling
- A modern browser (ES2020, Canvas API, `fetch`)

## Install

::: code-group

```bash [npm]
npm install @facioquo/indy-charts chart.js chartjs-plugin-annotation
```

```bash [pnpm]
pnpm add @facioquo/indy-charts chart.js chartjs-plugin-annotation
```

```bash [yarn]
yarn add @facioquo/indy-charts chart.js chartjs-plugin-annotation
```

:::

`chart.js` and `chartjs-plugin-annotation` are peer dependencies. Date utilities are bundled — you do **not** need a separate date library.

## First chart (verify)

Render a candlestick + volume chart against your API to confirm everything is wired up. Replace `https://api.example.com` with your stock-charts WebApi URL.

```html
<canvas id="overlay-chart" style="height:400px"></canvas>
```

```typescript
import {
  createApiClient,
  OverlayChart,
  setupIndyCharts
} from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({ baseUrl: "https://api.example.com" });
const quotes = await client.getQuotes();

const canvas = document.getElementById("overlay-chart") as HTMLCanvasElement;
const chart = new OverlayChart(canvas, {
  isDarkTheme: false,
  showTooltips: true,
  showRightAxisLabels: true // Optional: set to false to hide right-axis tick labels
});
chart.render(quotes.slice(-250));
```

If the chart renders, you're set. If not, check the browser console — most errors are missing peer deps or a wrong API URL.

## What you get

| Module | Purpose |
| --- | --- |
| `ChartManager`, `OverlayChart`, `OscillatorChart` | High-level chart classes |
| `createApiClient` | Typed REST client for quotes + indicators |
| `loadStaticQuotes`, `loadStaticIndicatorData` | Use your own data, no API needed |
| `Bar`, `IndicatorDataRow` (types) | Single source of truth shapes — `timestamp` accepts ISO string or `Date` |
| `setupIndyCharts`, `setupIndyChartsForVue` | One-time registration of Chart.js controllers |
| `getThemeColors`, `getFinancialPalette` | Theme + candlestick color helpers |

TypeScript definitions ship in the package — no `@types/` install required.

## Next steps

- [Quick start](/guide/quick-start) — build a chart with indicators, step by step
- [Custom data](/examples/custom-data) — render without an API
- [API client reference](/reference/api-client)
