---
next:
  text: Overlay chart
  link: /examples/
---

# Theme customization

The library includes built-in light and dark themes that automatically adapt to your application's appearance preference.

## Theme support

By default, charts automatically detect your site's theme:

- **Light theme**: Light backgrounds with dark text
- **Dark theme**: Dark backgrounds with light text

Colors are applied consistently to:

- Axis labels and values (controlled by `showRightAxisLabels` setting)
- Annotation backgrounds (legend labels)
- Grid lines
- Chart grid colors

## Reading theme colors

When you need the same palette outside of a chart (custom legends, side panels, etc.), call `getThemeColors()` with the same `ChartSettings` you pass to `ChartManager`:

```typescript
import { getThemeColors } from "@facioquo/indy-charts";

const colors = getThemeColors({
  isDarkTheme: true,
  showTooltips: false,
  showRightAxisLabels: true
});
// colors.text       === "#808080"
// colors.background === "#12131680"
// colors.grid       === "#2E2E2E"
```

`showTooltips` and `showRightAxisLabels` are required by `ChartSettings` but are not used by `getThemeColors`. Override the background by setting `settings.background` — the returned `colors.background` will reflect it.

```typescript
interface ThemeColors {
  text: string;       // Axis labels and annotation text
  background: string; // Annotation backdrops and mirrored axis labels
  grid: string;       // Grid lines
}
```

## Background color

Annotation labels and mirrored axis-tick labels are rendered with a semi-transparent background that should match the chart's container background. The defaults work for standard VitePress themes, but if your page uses a custom background (for example, a colored card or a panel with a distinct surface color) you can override the background per chart or site-wide.

### Per-instance override

Pass `background` as a prop or inside `:config` to override for a single chart:

```vue
<!-- Prop -->
<StockIndicatorChart indicator="rsi" background="#1a1b20cc" />

<!-- Config object -->
<StockIndicatorChart
  indicator="rsi"
  :config="{ background: '#1a1b20cc' }"
/>
```

The value can be any CSS color string — hex, `rgba()`, or `hsla()` all work.

### Site-wide override

When your site uses the same custom background for all charts, set `darkBackground` and/or `lightBackground` in `setupIndyChartsForVue`:

```typescript
setupIndyChartsForVue(app, {
  api: { baseUrl: "https://api.example.com" },
  theme: {
    observeVitePressDarkMode: true,
    darkBackground: "#1a1b20cc",
    lightBackground: "#f5f5f5e6"
  }
});
```

The resolution order is: per-instance prop → per-instance config → site-wide theme → built-in defaults.

## Light and dark presets

| Element | Light | Dark |
| --- | --- | --- |
| **Text** | `#121316` | `#808080` |
| **Background** | `#FAF9FD90` | `#12131680` |
| **Grid** | `#E0E0E0` | `#2E2E2E` |

## VitePress integration

VitePress automatically switches theme colors when users toggle dark mode:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

Charts update automatically as the user's theme preference changes.

## Candlestick colors

Financial chart colors (candlesticks, volume) use dedicated color palettes that are separate from theme colors. These are based on price movement:

- **Up days**: Green
- **Down days**: Red
- **Unchanged**: Gray

## Next steps

- [Quick Start](/guide/quick-start) - Get started with basic charts
- [Examples](/examples/) - See working examples
