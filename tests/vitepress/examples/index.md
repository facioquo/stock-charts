# Basic chart example

A simple candlestick chart with volume.

## Live demo

<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>

## Source code

```vue
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>
```

## Key points

1. **Client-only rendering**: VitePress embeds the demo inside `<ClientOnly>` to avoid SSR issues with `<canvas>`
2. **Reusable component**: `StockIndicatorChart` handles data loading, resize, cleanup, and theme synchronization
3. **Overlay indicator**: Renders price candlesticks, volume bars, and EMA on one chart
4. **Full stack workflow**: The demo is designed for normal dev activity against the local Web API

## Next steps

- Add [technical indicators](/examples/indicators)
- Create [multiple charts](/examples/multiple)
- Read the [quick-start guide](/guide/quick-start)
