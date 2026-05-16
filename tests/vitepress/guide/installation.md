# Installation

## Prerequisites

Make sure you have Node.js 22+ installed.

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

`chartjs-adapter-date-fns` and `date-fns` are bundled inside `@facioquo/indy-charts`.
You do not need to install them separately.

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
