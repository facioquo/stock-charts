---
layout: home

hero:
  name: Indy Charts
  text: Financial charting, batteries included
  tagline: Candlesticks, volume, and ten-plus technical indicators on Chart.js — Vue, React, Angular, or vanilla JS.
  actions:
    - theme: brand
      text: Install
      link: /guide/installation
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: API reference
      link: /reference/api-client

features:
  - icon: 📊
    title: Price + volume charts
    details: Candlestick and volume rendered in one canvas, with sensible defaults out of the box.
    link: /examples/
    linkText: See overlay example

  - icon: 📈
    title: Built-in indicators
    details: SMA, EMA, RSI, MACD, Bollinger Bands, and more. Standalone oscillators or paired with the price chart.
    link: /examples/indicators
    linkText: See oscillator example

  - icon: 🎨
    title: Light + dark themes
    details: Auto-syncs with VitePress dark mode. Per-instance or site-wide background overrides.
    link: /guide/themes
    linkText: Theme docs

  - icon: 🔌
    title: Bring your own data
    details: Use the bundled API client or hand the chart pre-loaded Quote[] — no API required.
    link: /examples/custom-data
    linkText: Static data example

  - icon: 📦
    title: TypeScript first
    details: Strict types, ES2020 target, Canvas + fetch APIs only. Runs in every modern browser.

  - icon: ⚡
    title: 250+ bars, instant pan
    details: Tuned for large daily-quote datasets with non-intersecting tooltips and animation-free updates.
---

## See it in action

A price chart with an EMA overlay:

<ClientOnly>
  <StockIndicatorChart indicator="ema" :config="{ id: 'home-ema-overlay' }" />
</ClientOnly>

A standalone RSI oscillator:

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :config="{ id: 'home-rsi-standalone' }" />
</ClientOnly>

An oscillator paired with the price chart (`:with-overlay="true"`):

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" :config="{ id: 'home-rsi-with-overlay' }" />
</ClientOnly>

Each instance is independent and manages its own `ChartManager`. Drop as many as you want on a page.

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

## Use it

In any TS/JS project:

```typescript
import { createApiClient, OverlayChart, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({ baseUrl: "https://api.example.com" });
const quotes = await client.getQuotes();

const canvas = document.getElementById("chart") as HTMLCanvasElement;
const chart = new OverlayChart(canvas, { isDarkTheme: false, showTooltips: true });
chart.render(quotes.slice(-250));
```

In Vue / VitePress, register the adapter once and use the global component:

```typescript
// .vitepress/theme/index.ts (or main.ts)
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://api.example.com" },
      indicators: { ema: { uiid: "EMA", params: { lookbackPeriods: 20 } } }
    });
  }
};
```

```vue
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

## Under the hood

Built on [Chart.js](https://chartjs.org). Runs anywhere ES2020 + Canvas + `fetch` are available — every browser shipped in the last few years. Source: [github.com/facioquo/stock-charts](https://github.com/facioquo/stock-charts).
