/**
 * Financial Charts for Chart.js
 * 
 * Modular TypeScript implementation of financial chart types
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

// Core components
export { FinancialElement } from "./financial-element";
export { FinancialController } from "./financial-controller";
export { CandlestickElement } from "./candlestick-element";
export { CandlestickController } from "./candlestick-controller";
export { OhlcElement } from "./ohlc-element";
export { OhlcController } from "./ohlc-controller";

// Type definitions
export type { FinancialDataPoint } from "./financial-chart.registry.d";

// Registration system
export {
  ensureFinancialChartsRegistered,
  areFinancialChartsRegistered,
  forceReregisterFinancialCharts,
  getRegisteredFinancialChartTypes
} from "./register-financial";

// Colors and theming
export {
  DEFAULT_FINANCIAL_COLORS,
  ENHANCED_FINANCIAL_COLORS,
  VOLUME_COLORS,
  FINANCIAL_CHART_COLORS,
  createCandlestickColorCallback,
  createVolumeColorCallback,
  createCandlestickBorderColorCallback,
  getOhlcColor,
  processFinancialDataColors
} from "./colors";
export type { FinancialColorConfig } from "./colors";

// Dataset and chart factories
export {
  createCandlestickDataset,
  createVolumeDataset,
  createVolumeDatasetFromFinancialData,
  createFinancialChartBaseOptions,
  createCandlestickChartConfig,
  createOhlcChartConfig,
  addExtraFinancialBars,
  addExtraVolumeBars
} from "./factories";
export type {
  CandlestickDatasetOptions,
  VolumeDatasetOptions,
  FinancialChartBaseOptions
} from "./factories";