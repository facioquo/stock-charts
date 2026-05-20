# Multiple charts

Independent chart instances on the same page, each with its own data window. The indicator's type determines rendering: overlay indicators (like EMA) appear on the price chart; oscillators (like RSI) render standalone; add `:with-overlay="true"` to pair an oscillator with the price chart.

## Overlay chart

<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>

## Standalone oscillator

<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>

## Oscillator with price chart

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>

## Source code

```vue
<!-- Overlay chart (EMA on price) -->
<ClientOnly>
  <StockIndicatorChart indicator="ema" />
</ClientOnly>

<!-- Standalone oscillator -->
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>

<!-- Oscillator paired with price chart -->
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

## Notes

- Each `<StockIndicatorChart>` instance manages its own `ChartManager` and data lifecycle.
- Quote data is fetched independently per instance. For large pages, pass a consistent `quoteCount` across instances to limit API calls.

## Next steps

- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
