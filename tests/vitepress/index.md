---
layout: home

hero:
  name: Indy Charts
  text: Financial Charting Made Simple
  tagline: Framework-agnostic financial charting library with technical indicators
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View Examples
      link: /examples/

features:
  - icon: 📊
    title: Financial Charts
    details: Candlestick, OHLC, and volume charts built on Chart.js with full customization.

  - icon: 📈
    title: Technical Indicators
    details: Support for multiple indicators including SMA, EMA, RSI, MACD, and more.

  - icon: 🎨
    title: Theme Support
    details: Built-in light and dark themes with customizable color palettes.

  - icon: 🔧
    title: Framework Agnostic
    details: Works with Vue, React, Angular, or vanilla JavaScript.

  - icon: 📦
    title: TypeScript
    details: Full TypeScript support with comprehensive type definitions.

  - icon: ⚡
    title: Performance
    details: Optimized for large datasets with efficient rendering and responsive chart updates.
---

## Quick Example

```typescript
import { createApiClient, OverlayChart, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const client = createApiClient({ baseUrl: "https://localhost:5001" });
const quotes = await client.getQuotes();

const chart = new OverlayChart(document.getElementById("main-chart") as HTMLCanvasElement, {
  isDarkTheme: false,
  showTooltips: true
});

chart.render(quotes.slice(-250));
```

## Installation

::: code-group

```bash [npm]
npm install @facioquo/indy-charts chart.js chartjs-adapter-date-fns chartjs-plugin-annotation date-fns
```

```bash [pnpm]
pnpm add @facioquo/indy-charts chart.js chartjs-adapter-date-fns chartjs-plugin-annotation date-fns
```

```bash [yarn]
yarn add @facioquo/indy-charts chart.js chartjs-adapter-date-fns chartjs-plugin-annotation date-fns
```

:::
