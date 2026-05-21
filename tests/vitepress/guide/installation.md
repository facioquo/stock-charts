# Installation

## Prerequisites

Make sure you have Node.js 24+ installed.

## Install dependencies

Install the package and its peer dependencies:

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

## Package overview

### @facioquo/indy-charts

The main library providing:

- Chart abstractions (ChartManager, OverlayChart, OscillatorChart)
- Configuration builders
- Data transformers
- API client
- Vue adapter through `@facioquo/indy-charts/vue` (also works with VitePress)

### Peer dependencies

- **chart.js**: Core charting library
- **chartjs-plugin-annotation**: Annotation support

### Bundled dependencies

Date and time utilities are bundled inside `@facioquo/indy-charts`.
You do not need to install additional date-handling packages.

### Vue integration

For Vue applications (including VitePress), register the chart library once in your app entry point. Vue developers should use the `<StockIndicatorChart />` component for simple, interactive charts without manual Chart.js configuration.

## TypeScript

Both libraries include full TypeScript definitions. No additional `@types` packages needed.

## Next steps

Continue to [Quick Start](/guide/quick-start) to create your first chart.
