# VitePress integration example

Minimal VitePress site demonstrating `@facioquo/indy-charts` integration.

## Overview

This example shows how to use the indy-charts VitePress adapter in a documentation site with:

- Basic candlestick charts
- Volume charts
- Technical indicators
- Multiple chart layouts

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

The site will be available at `http://localhost:4300`.

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
│   ├── config.ts          # VitePress configuration
│   └── theme/             # Adapter registration and styling
│       ├── index.ts
│       ├── custom.css
├── guide/
│   ├── index.md           # Introduction
│   ├── installation.md    # Installation guide
│   └── quick-start.md     # Quick start guide
├── examples/
│   ├── index.md           # Basic chart example
│   ├── indicators.md      # Charts with indicators
│   └── multiple.md        # Multiple charts example
├── index.md               # Home page
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

- `/examples/` renders a live overlay indicator chart through `StockIndicatorChart`
- `/examples/indicators` renders a live oscillator chart through `StockIndicatorChart`
- `/examples/multiple` is currently a recipe page (truthful code, no live embed)

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
- The adapter API `baseUrl` matches the running Web API (`https://localhost:5001` by default)
- The requested indicator is registered in the adapter `indicators` config
- Local Web API CORS includes VitePress dev/preview ports (`4300` / `4301`)

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Indy Charts API Reference](https://github.com/facioquo/stock-charts/tree/reusable-charts/libs/indy-charts)

## License

Apache-2.0
