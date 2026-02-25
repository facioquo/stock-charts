# VitePress Integration Example

Minimal VitePress site demonstrating `@facioquo/indy-charts` integration.

## Overview

This example shows how to use the indy-charts library in a VitePress documentation site with:

- Basic candlestick charts
- Volume charts
- Technical indicators
- Multiple chart layouts

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (recommended)

### Install Dependencies

From the repository root:

```bash
pnpm install
```

### Run Development Server

```bash
cd tests/vitepress
pnpm run dev
```

The site will be available at `http://localhost:5173`

### Build for Production

```bash
pnpm run build
```

### Preview Production Build

```bash
pnpm run preview
```

## Project Structure

```text
tests/vitepress/
├── .vitepress/
│   ├── config.ts          # VitePress configuration
│   └── theme/             # Demo components and styling
│       ├── index.ts
│       ├── custom.css
│       └── components/
│           ├── IndyOverlayDemo.vue
│           └── IndyIndicatorsDemo.vue
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

## Key Features

### Vue Components (Recommended Pattern)

VitePress uses Vue 3, so you can use Vue components directly in markdown:

```vue
<ClientOnly>
  <IndyOverlayDemo api-base-url="https://localhost:5001" :bar-count="250" />
</ClientOnly>
```

### Live Examples

- `/examples/` renders a live `OverlayChart` demo
- `/examples/indicators` renders live indicator charts via `ChartManager`
- `/examples/multiple` is currently a recipe page (truthful code, no live embed)

### TypeScript Support

Full TypeScript support with type checking enabled in VitePress config.

## Customization

### Theme

VitePress theme can be customized in `.vitepress/theme/`:

```typescript
// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme";
import "./custom.css";

export default DefaultTheme;
```

### Navigation

Configure navigation in `.vitepress/config.ts`:

```typescript
export default defineConfig({
  themeConfig: {
    nav: [
      /* ... */
    ],
    sidebar: [
      /* ... */
    ]
  }
});
```

## Deployment

### Build

```bash
pnpm run build
```

Output will be in `.vitepress/dist/`

### Deploy to GitHub Pages

See [VitePress deployment guide](https://vitepress.dev/guide/deploy)

### Deploy to Netlify/Vercel

Configure build command:

```bash
pnpm run build
```

Output directory:

```text
.vitepress/dist
```

## Troubleshooting

### Module Resolution

If you encounter module resolution issues, ensure:

1. Dependencies are installed: `pnpm install`
2. Workspace links are correct in `package.json`
3. VitePress cache is cleared: `rm -rf .vitepress/cache`

### Chart Not Rendering

Check:

1. Canvas element is properly referenced
2. `setupIndyCharts()` is called before creating charts
3. The Web API is running (`https://localhost:5001`)
4. Local Web API CORS includes VitePress dev/preview ports (`5173` / `4173`)

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Indy Charts API Reference](https://github.com/facioquo/stock-charts/tree/reusable-charts/libs/indy-charts)
- [Chart.js Financial Plugin](https://github.com/facioquo/stock-charts/tree/reusable-charts/libs/chartjs-financial)

## License

MIT
