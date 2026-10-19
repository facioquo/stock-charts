<script setup>
import StaticChart from "./StaticChart.vue";
</script>

# Axis labels and tooltips

The same price chart twice: once with the right-hand labels and tooltips this site turns off elsewhere, once without.

## Live demo

### Labels and tooltips on

<ClientOnly>
  <StaticChart show-right-axis-labels show-tooltips />
</ClientOnly>

The right-hand column carries the price scale and, at the foot of the chart, the volume scale. The volume label marks one round level, such as `100M`, measured from the bars' zero baseline, so any bar's height reads as a quantity. Hover the chart to see the tooltip list the candle, the volume, and the EMA(20) at that bar.

### Labels and tooltips off

<ClientOnly>
  <StaticChart />
</ClientOnly>

These are the defaults this documentation site sets for a cleaner look. The package's own defaults are labels on and, for the Vue component, tooltips off.

## Source code

```typescript
import { OverlayChart, loadStaticQuotes, setupIndyCharts } from "@facioquo/indy-charts";

setupIndyCharts();

const canvas = document.getElementById("price-chart") as HTMLCanvasElement;
const chart = new OverlayChart(canvas, {
  isDarkTheme: true,
  showTooltips: true, // hover readout of every series at the bar
  showRightAxisLabels: true // price and volume scales (the default)
});
chart.render(loadStaticQuotes(myQuotes));
```

With the Vue component, set them for every chart on the site:

```typescript
setupIndyChartsForVue(app, {
  api: { baseUrl: "https://api.example.com" },
  defaults: {
    showTooltips: true, // default: false
    showRightAxisLabels: true // default: true
  }
});
```

## Key points

1. **One switch for every scale**: `showRightAxisLabels` shows or hides the price, volume, and oscillator labels together. Gridlines draw either way.
2. **Volume reads as a quantity**: the volume label follows the visible window, so it stays in proportion as the window changes.
3. **Tooltips are opt-in for the Vue component**: set `defaults.showTooltips` to turn them on. `ChartSettings.showTooltips` has no default, so a chart built directly always states it.

## Next steps

- See every option and its default in [chart options](/reference/chart-options)
- Supply your own [custom data](/examples/custom-data)
