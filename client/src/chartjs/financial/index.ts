// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

// Types
export type { FinancialDataPoint, FinancialColorConfig, FinancialParsedData } from "./types";

// Base classes
export { FinancialElement } from "./financial-element";
export { FinancialController } from "./financial-controller";

// Candlestick implementation
export { CandlestickElement } from "./candlestick-element";
export { CandlestickController } from "./candlestick-controller";

// OHLC implementation
export { OhlcElement } from "./ohlc-element";
export { OhlcController } from "./ohlc-controller";

// Utilities
export {
  DEFAULT_FINANCIAL_COLORS,
  createFinancialColors,
  getFinancialColor,
  FINANCIAL_COLOR_SCHEMES
} from "./colors";

export {
  createCandlestickDataset,
  createVolumeDataset,
  createFinancialChartConfig,
  PERFORMANCE_OPTIMIZED_OPTIONS
} from "./factories";

export type {
  CandlestickDatasetOptions,
  VolumeDatasetOptions,
  FinancialChartOptions
} from "./factories";

// Registration
export {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from "./register-financial";