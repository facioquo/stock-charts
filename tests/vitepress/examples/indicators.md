# Charts with Indicators

Example showing how to add technical indicators to charts.

## Overview

This example demonstrates:
- Adding SMA (Simple Moving Average) overlays
- Adding RSI (Relative Strength Index) oscillator
- Customizing indicator parameters

## Code Example

```typescript
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';
import annotationPlugin from 'chartjs-plugin-annotation';
import { registerFinancialCharts } from '@facioquo/chartjs-chart-financial';
import { ChartManager, loadStaticQuotes, loadStaticIndicatorData } from '@facioquo/indy-charts';

// Register components
Chart.register(...registerables, annotationPlugin);
registerFinancialCharts();

// Create manager with oscillator canvas
const manager = new ChartManager({
  mainCanvas: document.getElementById('main-chart'),
  volumeCanvas: document.getElementById('volume-chart'),
  oscillatorCanvas: document.getElementById('oscillator-chart')
});

// Load data
const quotes = await loadStaticQuotes('AAPL');
manager.setQuotes(quotes);

// Add SMA indicator overlay
const sma20 = await loadStaticIndicatorData('SMA', { period: 20 });
const sma50 = await loadStaticIndicatorData('SMA', { period: 50 });

// Render main chart with indicators
manager.renderMainChart('candlestick', {
  overlays: [
    { type: 'SMA', data: sma20, color: 'blue' },
    { type: 'SMA', data: sma50, color: 'red' }
  ]
});

// Render volume
manager.renderVolumeChart();

// Add RSI oscillator
const rsi = await loadStaticIndicatorData('RSI', { period: 14 });
manager.renderOscillatorChart('RSI', rsi);
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

## Indicator Parameters

Each indicator accepts different parameters:

```typescript
// SMA with custom period
loadStaticIndicatorData('SMA', { period: 20 });

// EMA with custom period
loadStaticIndicatorData('EMA', { period: 12 });

// RSI with custom period
loadStaticIndicatorData('RSI', { period: 14 });

// MACD with custom parameters
loadStaticIndicatorData('MACD', {
  fastPeriod: 12,
  slowPeriod: 26,
  signalPeriod: 9
});
```

## Styling Indicators

Customize indicator appearance:

```typescript
manager.renderMainChart('candlestick', {
  overlays: [
    {
      type: 'SMA',
      data: sma20,
      color: 'rgba(0, 123, 255, 0.8)',
      lineWidth: 2,
      label: 'SMA 20'
    }
  ]
});
```

## Multiple Oscillators

Display multiple oscillators:

```typescript
// Create additional canvas elements
const rsiCanvas = document.getElementById('rsi-chart');
const macdCanvas = document.getElementById('macd-chart');

// Render different oscillators
manager.renderOscillatorChart('RSI', rsiData, { canvas: rsiCanvas });
manager.renderOscillatorChart('MACD', macdData, { canvas: macdCanvas });
```

## Next Steps

- Learn about [multiple charts](/examples/multiple)
- Configure [API client](/guide/api-client)
- Explore [chart customization](/guide/customization)
