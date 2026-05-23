# Oscillator chart

Oscillator indicators render as a standalone chart — no price chart required by default.

## Standalone oscillator

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :config="{ id: 'rsi-standalone' }" />
</ClientOnly>

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" />
</ClientOnly>
```

## Oscillator paired with price chart

Use `:with-overlay="true"` to show the price and volume chart above the oscillator.

<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" :config="{ id: 'rsi-with-overlay' }" />
</ClientOnly>

```vue
<ClientOnly>
  <StockIndicatorChart indicator="rsi" :with-overlay="true" />
</ClientOnly>
```

## Custom parameters

Use the `config` prop to override registered indicator parameters:

```vue
<ClientOnly>
  <StockIndicatorChart
    indicator="rsi"
    :config="{ params: { lookbackPeriods: 21 }, results: ['rsi'] }"
  />
</ClientOnly>
```

## Notes

- Oscillators render standalone by default. Add `:with-overlay="true"` to pair with the price chart.
- Charts automatically respect your site's dark/light theme preference.

## Next steps

- See [multiple charts](/examples/multiple) for independent chart instances on one page
- Read the [quick-start guide](/guide/quick-start)
- Explore [installation options](/guide/installation)
