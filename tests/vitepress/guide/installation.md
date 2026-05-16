# Installation

## Prerequisites

Make sure you have Node.js 22+ installed.

## Install dependencies

Install the VitePress adapter package and its setup-level peer dependencies:

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
- **chartjs-adapter-date-fns**: Date handling for Chart.js
- **chartjs-plugin-annotation**: Annotation support
- **date-fns**: Date formatting utilities

### Transitive dependency

`@facioquo/indy-charts` depends on `@facioquo/chartjs-chart-financial`
internally. Most consumers should not need to install it directly.

### Vue adapter

Register charts once in your app entry (e.g. `main.ts` for plain Vue, or
`.vitepress/theme/index.ts` for VitePress) by importing
`setupIndyChartsForVue` from `@facioquo/indy-charts/vue`.
Markdown page authors should use `<StockIndicatorChart />` and should not import
Chart.js, the API client, or `@facioquo/chartjs-chart-financial` directly.

Vue is an optional peer dependency because only the `/vue` subpath imports
Vue. Consumers that use the root `@facioquo/indy-charts` APIs do not load
the Vue adapter.

## TypeScript

Both libraries include full TypeScript definitions. No additional `@types` packages needed.

## Next steps

Continue to [Quick Start](/guide/quick-start) to create your first chart.
