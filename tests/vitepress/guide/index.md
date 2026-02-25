# Introduction

@facioquo/indy-charts is a framework-agnostic financial charting library that provides:

- High-level chart abstractions (`ChartManager`, `OverlayChart`, `OscillatorChart`)
- Technical indicator support
- Data transformation utilities
- API client utilities and static data helpers
- Pre-configured chart options

Built on top of [@facioquo/chartjs-chart-financial](https://github.com/facioquo/stock-charts/tree/main/libs/chartjs-financial) and Chart.js.

## Features

### Chart Types

- **Candlestick Charts**: Classic Japanese candlestick visualization
- **OHLC Charts**: Open-High-Low-Close bar charts
- **Volume Charts**: Trading volume bars with color coding
- **Line Charts**: Price trends and indicator overlays

### Technical Indicators

Support for common indicators including:

- Simple Moving Average (SMA)
- Exponential Moving Average (EMA)
- Relative Strength Index (RSI)
- Moving Average Convergence Divergence (MACD)
- Bollinger Bands
- And more...

### API Client

Built-in API client with:

- RESTful endpoint integration
- Typed `getQuotes()`, `getListings()`, and `getSelectionData(...)` methods
- Static data loading for demos

### Configuration

Pre-built configurations for:

- Overlay charts (price + indicators)
- Oscillator charts (RSI, MACD, etc.)
- Volume charts
- Common chart options

## Architecture

The library is organized into modules:

- **charts/**: High-level chart classes
- **config/**: Configuration builders and types
- **data/**: Data transformation utilities
- **api/**: API client and data loading

## Use Cases

Perfect for:

- Financial applications
- Trading platforms
- Portfolio dashboards
- Technical analysis tools
- Educational projects

## Browser Support

Works in all modern browsers that support:

- ES2020
- Canvas API
- `fetch` API

## Next Steps

- [Installation](/guide/installation) - Install the library
- [Quick Start](/guide/quick-start) - Create your first chart
- [Examples](/examples/) - See working examples
