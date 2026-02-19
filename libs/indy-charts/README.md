# @facioquo/indy-charts

Framework-agnostic financial charting library with technical indicators and stock market data visualization built on Chart.js.

## Features

- **Chart Abstractions**: High-level `OverlayChart`, `OscillatorChart`, and `ChartManager` classes
- **Technical Indicators**: Support for multiple indicators with customizable parameters
- **Data Transformations**: Quote data processing and OHLC data point builders
- **API Client**: Built-in API client with LocalStorage caching
- **Configuration Builders**: Pre-configured chart options for financial charts
- **TypeScript**: Full type definitions included
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS

## Installation

```bash
npm install @facioquo/indy-charts @facioquo/chartjs-chart-financial chart.js chartjs-adapter-date-fns chartjs-plugin-annotation date-fns
```

## Quick Start

```typescript
import { Chart, registerables } from "chart.js";
import { registerFinancialCharts } from "@facioquo/chartjs-chart-financial";
import { ChartManager, createApiClient } from "@facioquo/indy-charts";

// Register Chart.js components
Chart.register(...registerables);
registerFinancialCharts();

// Create API client
const apiClient = createApiClient({
  baseUrl: "https://api.example.com",
  cacheEnabled: true
});

// Create chart manager
const manager = new ChartManager({
  mainCanvas: document.getElementById("main-chart"),
  volumeCanvas: document.getElementById("volume-chart"),
  oscillatorCanvas: document.getElementById("oscillator-chart"),
  apiClient
});

// Load data and render charts
await manager.loadQuotes("AAPL");
manager.renderMainChart("candlestick");
manager.renderVolumeChart();
```

## Architecture

### Chart Classes

- **ChartManager**: Orchestrates multiple charts and manages data flow
- **OverlayChart**: Main price chart with optional indicator overlays
- **OscillatorChart**: Technical oscillator indicators (RSI, MACD, etc.)

### Configuration

Pre-built configuration objects for common chart types:

- `baseOverlayConfig`: Base configuration for overlay charts
- `baseOscillatorConfig`: Base configuration for oscillator charts
- `baseChartOptions`: Common Chart.js options
- `baseDataset`: Common dataset configuration

### Data Processing

- `processQuoteData(quotes)`: Transform raw quote data
- `buildDataPoints(quotes)`: Create Chart.js data points
- `addExtraBars(data, count)`: Extend chart data for future dates
- `getCandlePointConfiguration(data)`: Generate candle chart config

### API Client

```typescript
const apiClient = createApiClient({
  baseUrl: "https://api.example.com",
  cacheEnabled: true,
  cacheTTL: 3600000 // 1 hour
});

// Fetch quotes
const quotes = await apiClient.getQuotes("AAPL");

// Load static data (for demo/testing)
const staticQuotes = await loadStaticQuotes("AAPL");
```

## Usage with VitePress

See the VitePress integration example in the `tests/vitepress` directory for a complete working example.

## Types

### Core Types

- `Quote`: Stock quote data structure
- `IndicatorListing`: Indicator metadata and parameters
- `IndicatorSelection`: User-selected indicator configuration
- `ChartConfig`: Complete chart configuration
- `ChartManagerConfig`: Chart manager initialization config

### Configuration Types

- `ChartSettings`: Chart display settings
- `ChartThreshold`: Threshold line configuration
- `ChartFill`: Fill area configuration
- `IndicatorParam`: Indicator parameter definition
- `IndicatorResult`: Indicator calculation result

## License

MIT License - see LICENSE file for details.

## Related Projects

- [@facioquo/chartjs-chart-financial](../chartjs-financial) - Chart.js financial chart types
- [stock-charts](https://github.com/facioquo/stock-charts) - Full-featured Angular application
