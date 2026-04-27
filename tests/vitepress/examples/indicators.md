# Charts with Indicators

Example showing how to add technical indicators to charts.

## Overview

This example demonstrates:

- Adding EMA/SMA-style overlay indicators
- Adding RSI (Relative Strength Index) oscillator
- Customizing indicator parameters

## Live Demo

> **Requires full stack demo services**: Start the Web API (and supporting services) with the VS Code task `Run: VitePress chart demo full stack`.

<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>

## Normal authoring

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

## Available Indicators

### Overlay Indicators

Displayed on the main price chart:

- **SMA**: Simple Moving Average
- **EMA**: Exponential Moving Average
- **Bollinger Bands**: Volatility bands
- **VWAP**: Volume Weighted Average Price

### Oscillator Indicators

Displayed in separate chart below:

- **RSI**: Relative Strength Index (0-100)
- **MACD**: Moving Average Convergence Divergence
- **Stochastic**: Stochastic oscillator
- **CCI**: Commodity Channel Index

## Custom indicator parameters

Use the `config` prop when a page needs to override the site-level indicator registry:

```vue
<ClientOnly>
  <StockIndicatorChart
    indicator="rsi"
    :config="{ params: { lookbackPeriods: 21 }, title: 'RSI(21)', results: ['rsi'] }"
  />
</ClientOnly>
```

## Notes

- The live demo above uses the VitePress adapter registered by the site theme.
- Use additional `StockIndicatorChart` instances for additional indicators.

## Next Steps

- Learn about [multiple charts](/examples/multiple)
- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
