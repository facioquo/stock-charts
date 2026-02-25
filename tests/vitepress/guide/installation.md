# Installation

## Prerequisites

Make sure you have Node.js 18+ installed.

## Install Dependencies

Install the core libraries and their peer dependencies:

::: code-group

```bash [npm]
npm install @facioquo/indy-charts \
  chart.js \
  chartjs-adapter-date-fns \
  chartjs-plugin-annotation \
  date-fns
```

```bash [pnpm]
pnpm add @facioquo/indy-charts \
  chart.js \
  chartjs-adapter-date-fns \
  chartjs-plugin-annotation \
  date-fns
```

```bash [yarn]
yarn add @facioquo/indy-charts \
  chart.js \
  chartjs-adapter-date-fns \
  chartjs-plugin-annotation \
  date-fns
```

:::

## Package Overview

### @facioquo/indy-charts

The main library providing:

- Chart abstractions (ChartManager, OverlayChart, OscillatorChart)
- Configuration builders
- Data transformers
- API client

### Peer Dependencies

- **chart.js**: Core charting library
- **chartjs-adapter-date-fns**: Date handling for Chart.js
- **chartjs-plugin-annotation**: Annotation support
- **date-fns**: Date formatting utilities

### Transitive Dependency

`@facioquo/indy-charts` depends on `@facioquo/chartjs-chart-financial`
internally. Most consumers should not need to install it directly.

## TypeScript

Both libraries include full TypeScript definitions. No additional `@types` packages needed.

## Next Steps

Continue to [Quick Start](/guide/quick-start) to create your first chart.
