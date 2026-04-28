# Quick Start

This guide will help you create your first financial chart in minutes.

## Step 1: Register the VitePress adapter

Register the adapter once from `.vitepress/theme/index.ts`:

```typescript
import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVitePress } from "@facioquo/indy-charts/vitepress";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVitePress(app, {
      api: { baseUrl: "https://localhost:5001" },
      defaults: { barCount: 250, quoteCount: 250, showTooltips: true },
      indicators: {
        rsi: {
          uiid: "RSI",
          title: "RSI(14)",
          params: { lookbackPeriods: 14 },
          results: ["rsi"]
        }
      }
    });
  }
};
```

## Step 2: Add a chart to Markdown

Use the global component in any Markdown page:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

## Step 3: Override page-specific options

Use `config` for page-specific titles, parameters, or displayed result series:

```vue
<ClientOnly>
  <StockIndicatorChart
    indicator="rsi"
    :config="{ title: 'RSI(21)', params: { lookbackPeriods: 21 }, results: ['rsi'] }"
  />
</ClientOnly>
```

## Complete Example

Site setup:

```typescript
import DefaultTheme from "vitepress/theme";

import { setupIndyChartsForVitePress } from "@facioquo/indy-charts/vitepress";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    setupIndyChartsForVitePress(app, {
      api: { baseUrl: "https://localhost:5001" },
      indicators: { ema: { uiid: "EMA", params: { lookbackPeriods: 20 } } }
    });
  }
};
```

Markdown page:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

## Advanced API usage

Use `createApiClient`, `OverlayChart`, and `ChartManager` directly when building
custom applications outside the VitePress adapter.

## What's Next?

- See [basic example](/examples/) for a working demo
- Learn about [indicators](/examples/indicators)
- Explore [multiple charts](/examples/multiple)
- Read about [API client configuration](/guide/api-client)
