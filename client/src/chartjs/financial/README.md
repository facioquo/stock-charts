# chartjs-chart-financial

Financial charting extension for Chart.js v4.5+

This module provides candlestick and OHLC (Open-High-Low-Close) chart types for Chart.js, designed for displaying financial/stock market data.

## Features

- **Candlestick charts**: Visual representation of price movements with filled/hollow candles
- **OHLC charts**: Traditional bar charts showing open, high, low, and close prices
- **Typed for TypeScript**: Full TypeScript support with comprehensive type definitions
- **Modern Chart.js v4.5+ API**: Built specifically for Chart.js v4.5.1, no legacy code
- **Themeable**: Configurable color palettes for up/down/unchanged states
- **Optimized rendering**: Efficient canvas drawing with proper pixel alignment

## Installation

```bash
npm install chartjs-chart-financial chart.js@^4.5.1
```

## Usage

### Basic Candlestick Chart

```typescript
import { Chart } from "chart.js";
import {
  registerFinancialCharts,
  FinancialDataPoint
} from "chartjs-chart-financial";

// Register the financial chart types
registerFinancialCharts();

// Prepare your data
const data: FinancialDataPoint[] = [
  { x: Date.now(), o: 100, h: 110, l: 95, c: 105 },
  { x: Date.now() + 86400000, o: 105, h: 115, l: 100, c: 112 }
];

// Create the chart
const chart = new Chart(ctx, {
  type: "candlestick",
  data: {
    datasets: [
      {
        label: "Stock Price",
        data: data
      }
    ]
  }
});
```

### OHLC Chart

```typescript
const chart = new Chart(ctx, {
  type: "ohlc",
  data: {
    datasets: [
      {
        label: "Stock Price",
        data: data
      }
    ]
  }
});
```

### With Custom Colors

```typescript
import {
  getFinancialPalette,
  applyFinancialElementTheme
} from "chartjs-chart-financial";

const palette = getFinancialPalette("dark");
applyFinancialElementTheme(palette);
```

## API Reference

### Functions

- `registerFinancialCharts()` - Register candlestick and OHLC chart types with Chart.js
- `buildCandlestickDataset(data, borderColor)` - Helper to create typed candlestick datasets
- `buildVolumeDataset(quotes, extraBars, palette)` - Helper to create volume bar datasets
- `getFinancialPalette(mode)` - Get predefined color palette ('light' or 'dark')
- `getCandleColor(open, close, palette)` - Determine candle color based on price movement
- `getVolumeColor(open, close, palette)` - Determine volume bar color based on price movement

### Types

- `FinancialDataPoint` - Data point for OHLC data: `{ x, o, h, l, c }`
- `FinancialPalette` - Color palette configuration
- `FinancialThemeMode` - 'light' | 'dark'

### Controllers

- `CandlestickController` - Chart controller for candlestick charts
- `OhlcController` - Chart controller for OHLC charts

### Elements

- `CandlestickElement` - Visual element for rendering candlesticks
- `OhlcElement` - Visual element for rendering OHLC bars

## Chart.js v4.5+ Compatibility

This library is built specifically for Chart.js v4.5.1 and follows the latest API conventions:

- Extends `DatasetController` for custom chart types
- Uses proper element registration via `Chart.register()`
- Implements `updateElements(elements, start, count, mode)` pattern
- TypeScript declarations compatible with Chart.js v4.5+ types

## Data Format

Financial data points use the following structure:

```typescript
interface FinancialDataPoint {
  x: number; // Timestamp or x-axis value
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
}
```

## License

MIT License

Derived from [chartjs-chart-financial](https://github.com/chartjs/chartjs-chart-financial) (MIT License)
Adapted for Chart.js v4.5+ with TypeScript and modern API patterns.

## Credits

- Original chartjs-chart-financial by Chart.js contributors
- Refactored and modernized for Chart.js v4.5.1
- TypeScript definitions and optimization
