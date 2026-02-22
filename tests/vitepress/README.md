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
│   └── config.ts          # VitePress configuration
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

### Vue Components

VitePress uses Vue 3, so you can use Vue components directly in markdown:

```vue
<script setup>
import { onMounted, ref } from "vue";
import { ChartManager } from "@facioquo/indy-charts";

const canvasRef = ref(null);

onMounted(() => {
  const manager = new ChartManager({
    mainCanvas: canvasRef.value
  });
  // ... initialize chart
});
</script>

<canvas ref="canvasRef"></canvas>
```

### Live Examples

All examples include working code that runs in the browser. See the `examples/` directory.

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
    nav: [...],
    sidebar: [...]
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
2. Chart.js components are registered
3. Financial charts are registered
4. Data is loaded before rendering

## Resources

- [VitePress Documentation](https://vitepress.dev/)
- [Indy Charts API Reference](https://github.com/facioquo/stock-charts/tree/main/libs/indy-charts)
- [Chart.js Financial Plugin](https://github.com/facioquo/stock-charts/tree/main/libs/chartjs-financial)

## License

MIT
