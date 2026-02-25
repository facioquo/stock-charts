# Basic Chart Example

A simple candlestick chart with volume.

## Live Demo

> **Requires full stack demo services**: Start the Web API (and supporting services) with the new VS Code task `Run: VitePress chart demo full stack`.

<ClientOnly>
  <IndyOverlayDemo />
</ClientOnly>

## Source Code

```vue
<ClientOnly>
  <IndyOverlayDemo api-base-url="https://localhost:5001" :bar-count="250" />
</ClientOnly>
```

## Key Points

1. **Client-only rendering**: VitePress embeds the demo inside `<ClientOnly>` to avoid SSR issues with `<canvas>`
2. **Reusable component**: `IndyOverlayDemo` handles data loading, resize, cleanup, and theme synchronization
3. **OverlayChart**: Renders price candlesticks and volume bars on a single canvas with dual y-axes
4. **Full stack workflow**: The demo is designed for normal dev activity against the local Web API

## Next Steps

- Add [technical indicators](/examples/indicators)
- Create [multiple charts](/examples/multiple)
- Use [real API data](/guide/api-client)
