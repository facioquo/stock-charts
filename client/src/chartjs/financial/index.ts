// Financial charts module exports
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

// Core components
export { FinancialElement } from "./financial-element";
export { FinancialController } from "./financial-controller";

// Candlestick chart
export { CandlestickElement, CandlestickElementComponent } from "./candlestick-element";
export { CandlestickController, CandlestickControllerComponent } from "./candlestick-controller";

// OHLC chart
export { OhlcElement, OhlcElementComponent } from "./ohlc-element";
export { OhlcController, OhlcControllerComponent } from "./ohlc-controller";

// Registration
export { ensureFinancialChartsRegistered, resetFinancialRegistration } from "./register-financial";

// Utilities
export {
  FINANCIAL_COLORS,
  createFinancialColorCallback,
  createVolumeColorCallback,
  isBullish,
  isBearish,
  isUnchanged,
  createVolumeColors
} from "./colors";

export {
  FINANCIAL_CHART_OPTIONS,
  createCandlestickDataset,
  createOhlcDataset,
  createVolumeDataset,
  processFinancialData,
  createFinancialChartOptions
} from "./factories";

// Types
export type {
  FinancialDataPoint,
  FinancialParsedData,
  FinancialElementProps,
  FinancialDatasetOptions,
  FinancialColorOptions,
  BarBounds,
  FinancialRuler
} from "./types";

// Type augmentations (import for side effects)
import "./financial-chart.registry.d";