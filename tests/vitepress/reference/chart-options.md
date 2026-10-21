# Chart options

Every option `@facioquo/indy-charts` accepts, with its default. Options for fetching data live in the [API client](/reference/api-client) reference.

An option marked **required** has no default; leave it out and TypeScript reports an error.

## Chart settings

`ChartSettings` styles every chart. Pass it to `new ChartManager({ settings })`, `new OverlayChart(canvas, settings)`, or `new OscillatorChart(canvas, settings)`, and change it later with `manager.updateTheme(settings)`.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `isDarkTheme` | `boolean` | required | Picks the dark or light palette for candles, volume, text, gridlines, and backdrops. |
| `showTooltips` | `boolean` | required | Shows a tooltip on hover that lists every series at the hovered bar, volume included. |
| `showRightAxisLabels` | `boolean` | `true` | Shows the right-hand value labels: the price scale, each oscillator scale, and the volume scale. Gridlines draw either way. |
| `showSeriesLegend` | `boolean` | `false` | Names each line of a multi-line oscillator pane, such as ADX or MACD, in its legend with a swatch in the line's color. A single-line pane shows the indicator label alone either way. |
| `background` | `string` | `#FAF9FD90` light, `#12131680` dark | Backdrop color behind axis labels and legend annotations. Match it to the page behind the chart. |

```typescript
const settings: ChartSettings = {
  isDarkTheme: true,
  showTooltips: true,
  showRightAxisLabels: true, // default
  background: "#1b1b1f80"
};
```

### Volume scale

The volume bars at the foot of the price chart carry one abbreviated label, such as `5M`, in the right-hand column with the price labels. It marks a round volume level measured from the bars' zero baseline, so any bar's height reads as a quantity. The level is re-chosen as the visible window changes. It hides with the other right-hand labels when `showRightAxisLabels` is `false`.

## Chart manager

`new ChartManager(config)` coordinates the price chart and its oscillator panes.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `settings` | `ChartSettings` | required | The [chart settings](#chart-settings) every chart in the manager uses. |
| `extraBars` | `number` | `6` | Empty bars of space to the right of the newest bar, so the last candle and its labels are not pinned to the edge. |

The bar window is an argument rather than an option: `manager.initializeOverlay(canvas, quotes, barCount)` shows the newest `barCount` bars, and `manager.setBarCount(barCount)` changes it.

## Vue setup

`setupIndyChartsForVue(app, options)` registers the `<StockIndicatorChart>` component and the options every instance reads.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `api` | `ApiClientConfig` | required | Where to fetch quotes and indicators. Takes every [API client option](/reference/api-client#apiclientconfig). |
| `defaults` | object | `{}` | Defaults for every chart, listed [below](#defaults). |
| `theme` | object | `{}` | Theme handling, listed [below](#theme). |
| `indicators` | `Record<string, StockIndicatorChartConfig>` | `{}` | Named indicator configurations that a chart selects with its `indicator` prop. Each entry takes the [indicator options](#indicator-options). |

### Defaults

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `indicator` | `string` | none | The indicator a chart shows when it has no `indicator` prop. |
| `barCount` | `number` | `250` | How many of the newest bars each chart shows. |
| `quoteCount` | `number` | `250` | How many of the newest quotes each chart loads and computes indicators over. |
| `showTooltips` | `boolean` | `false` | Shows hover tooltips. |
| `showRightAxisLabels` | `boolean` | `true` | Shows the right-hand price, oscillator, and volume labels. |
| `showSeriesLegend` | `boolean` | `false` | Names each line of a multi-line oscillator pane in its legend. |

### Theme

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `observeVitePressDarkMode` | `boolean` | `true` | Follows the VitePress appearance toggle, re-rendering each chart when it changes. |
| `isDarkTheme` | `boolean` | `false` | Picks the dark palette. Read only when `observeVitePressDarkMode` is `false`. |
| `darkBackground` | `string` | `#12131680` | Label and annotation backdrop color in dark mode. |
| `lightBackground` | `string` | `#FAF9FD90` | Label and annotation backdrop color in light mode. |

## Indicator options

`StockIndicatorChartConfig` describes one indicator chart. Use it for an entry in the `indicators` registry or for a chart's `config` prop. When both are given, the `config` prop's fields win.

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `uiid` | `string` | the registry key | The catalog indicator to draw, such as `"EMA"` or `"BB-PCTB"`. |
| `title` | `string` | the catalog name | Legend title for the chart. |
| `params` | `Record<string, number>` | the catalog defaults | Indicator parameters, such as `{ lookbackPeriods: 20 }`. Any parameter left out takes its catalog default. |
| `results` | `string[]` | every result | Which result series to draw, by data name, such as `["percentB"]`. Matching ignores case. |
| `barCount` | `number` | `defaults.barCount` | How many of the newest bars this chart shows. |
| `quoteCount` | `number` | `defaults.quoteCount` | How many of the newest quotes this chart loads. |
| `with` | `string \| string[]` | none | Companion indicators to draw in the same chart, by registry key. Overlays join the price chart; oscillators stack beneath it on the same time axis. |
| `chartType` | `"overlay" \| "oscillator"` | none | Layout hint that reserves the right space before the catalog loads, so a first page view does not shift. The catalog still decides how the chart draws. |
| `background` | `string` | the theme background | Label and annotation backdrop color for this chart. |
| `id` | `string` | the `indicator` prop | Stable identifier for the chart's element id and test hooks. |

## `<StockIndicatorChart>` props

| Prop | Type | Default | What it does |
| --- | --- | --- | --- |
| `indicator` | `string` | `defaults.indicator` | Registry key of the indicator to draw. An unregistered name is used as the catalog `uiid`. |
| `config` | `StockIndicatorChartConfig` | `{}` | [Indicator options](#indicator-options) for this chart, merged over the registry entry. |
| `with` | `string \| string[]` | `config.with` | Companion indicators to draw in the same chart. |
| `barCount` | `number` | `config.barCount` | How many of the newest bars this chart shows. |
| `withOverlay` | `boolean` | `false` | Draws the price chart above an oscillator, so the oscillator reads against price. |
| `background` | `string` | `config.background` | Label and annotation backdrop color for this chart. |
| `id` | `string` | `config.id`, then `indicator` | Element id and `data-testid` prefix (`stock-indicator-chart-<id>`). Set it to put the same indicator on a page twice. |

Values resolve from the most specific source first. For `barCount` that is the prop, then the `config` prop, then the registry entry, then `defaults.barCount`, then `250`.

```vue
<StockIndicatorChart
  id="bb-with-pctb"
  indicator="bb"
  with="bbPctB"
  :bar-count="120"
  background="#00000000"
/>
```

## Next steps

- See these options at work in the [overlay chart example](/examples/)
- Fetch data with the [API client](/reference/api-client)
- Match your site's colors with [theme customization](/guide/themes)
