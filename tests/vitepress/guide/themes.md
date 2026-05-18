# Theme customization

The library includes built-in light and dark themes that automatically adapt to your application's appearance preference.

## Theme support

By default, charts automatically detect your site's theme:

- **Light theme**: Light backgrounds with dark text
- **Dark theme**: Dark backgrounds with light text

Colors are applied consistently to:

- Axis labels and values
- Annotation backgrounds
- Grid lines
- Chart grid colors

## Customizing theme colors

For advanced use cases, you can customize the theme colors by using the `getThemeColors()` function:

```typescript
import { getThemeColors } from "@facioquo/indy-charts";

// Get colors for your current theme
const colors = getThemeColors({ 
  isDarkTheme: true,
  showTooltips: true 
});

// colors.text = "#9E9E9E"
// colors.background = "#12131680"
// colors.grid = "#2E2E2E"
```

The returned colors apply to all UI elements:

```typescript
export interface ThemeColors {
  text: string;           // Axis label and annotation text color
  background: string;     // Background color for labels and annotations
  grid: string;          // Grid line color
}
```

## Light and dark presets

| Element | Light | Dark |
|---------|-------|------|
| **Text** | `#121316` | `#9E9E9E` |
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
