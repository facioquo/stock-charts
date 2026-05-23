# VitePress integration example

Minimal VitePress site demonstrating `@facioquo/indy-charts` integration.

## Overview

This example shows how to use the indy-charts Vue adapter in a documentation site with:

- Candlestick + volume overlay charts
- Standalone oscillator indicators (RSI, MACD, etc.)
- Oscillators paired with the price chart
- Custom (no-API) charts driven by your own quote data

## Getting started

### Prerequisites

- Node.js 24+
- pnpm (recommended)

### Install dependencies

From the repository root:

```bash
pnpm install
```

### Run development server

```bash
cd tests/vitepress
pnpm run dev
```

The site will be available locally at the address shown in your dev server output.

### Build for production

```bash
pnpm run build
```

### Preview production build

```bash
pnpm run preview
```

## Project structure

```text
tests/vitepress/
├── .vitepress/
│   ├── config.ts                 # VitePress configuration
│   └── theme/                    # Adapter registration and styling
│       ├── index.ts
│       └── custom.css
├── guide/
│   ├── installation.md           # Install + first-chart verification
│   ├── quick-start.md            # Step-by-step build
│   └── themes.md                 # Theme customization
├── examples/
│   ├── index.md                  # Overlay (price + EMA)
│   ├── indicators.md             # Oscillators
│   ├── custom-data.md            # No-API, bring-your-own quotes
│   ├── StaticChart.vue           # Demo component for custom-data
│   └── sample-quotes.ts          # Quote fixture for the static demo
├── reference/
│   └── api-client.md             # ApiClient reference
├── index.md                      # Home page (hero + live demos)
└── package.json
```

## Key features

### VitePress adapter (recommended pattern)

The theme registers `StockIndicatorChart` once with site-level API and indicator defaults:

```typescript
import { setupIndyChartsForVue } from "@facioquo/indy-charts/vue";

export default {
  enhanceApp({ app }) {
    setupIndyChartsForVue(app, {
      api: { baseUrl: "https://localhost:5001" },
      indicators: {
        rsi: { uiid: "RSI", params: { lookbackPeriods: 14 }, results: ["rsi"] }
      }
    });
  }
};
```

Markdown pages use the global component directly:

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

### Live examples

- `/` renders three live demos on the home page (overlay, standalone oscillator, oscillator with overlay)
- `/examples/` renders the standalone overlay chart example
- `/examples/indicators` renders the standalone oscillator example
- `/examples/custom-data` renders a bring-your-own-quotes example

### TypeScript support

Full TypeScript support with type checking enabled in VitePress config.

## Deployment

### Build

```bash
pnpm run build
```

Output will be in `.vitepress/dist/`

### Deploy to GitHub Pages

See [VitePress deployment guide](https://vitepress.dev/guide/deploy)

## Troubleshooting

### Module resolution

If you encounter module resolution issues, ensure:

- Dependencies are installed: `pnpm install`
- Workspace links are correct in `package.json`
- VitePress cache is cleared: `rm -rf .vitepress/cache`

### Chart not rendering

Check:

- `setupIndyChartsForVue()` is called from `.vitepress/theme/index.ts`
- The adapter API `baseUrl` matches the running Web API address
- The requested indicator is registered in the adapter `indicators` config
- Local Web API CORS includes the VitePress dev and preview origins

## Resources

- [VitePress documentation](https://vitepress.dev/)
- [Indy Charts source](https://github.com/facioquo/stock-charts/tree/main/libs/indy-charts)

## License

Apache-2.0
