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
    details: Optimized for large datasets with efficient rendering and caching.
---

## Quick Example

```typescript
import { Chart, registerables } from 'chart.js';
import { registerFinancialCharts } from '@facioquo/chartjs-chart-financial';
import { ChartManager, createApiClient } from '@facioquo/indy-charts';

// Register Chart.js components
Chart.register(...registerables);
registerFinancialCharts();

// Create chart manager
const manager = new ChartManager({
  mainCanvas: document.getElementById('main-chart'),
  volumeCanvas: document.getElementById('volume-chart'),
  apiClient: createApiClient({ baseUrl: '/api' })
});

// Load and render
await manager.loadQuotes('AAPL');
manager.renderMainChart('candlestick');
manager.renderVolumeChart();
```

## Installation

::: code-group

```bash [npm]
npm install @facioquo/indy-charts @facioquo/chartjs-chart-financial chart.js
```

```bash [pnpm]
pnpm add @facioquo/indy-charts @facioquo/chartjs-chart-financial chart.js
```

```bash [yarn]
yarn add @facioquo/indy-charts @facioquo/chartjs-chart-financial chart.js
```

:::
