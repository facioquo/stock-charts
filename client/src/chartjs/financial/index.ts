// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// Modular TypeScript integration for financial charts

// Type definitions and interfaces
export type {
  FinancialDataPoint,
  FinancialParsedData,
  FinancialColorConfig,
  FinancialElementProps,
  CandlestickControllerType,
  OhlcControllerType,
  FinancialElementType
} from "./types";

// Core classes
export { FinancialElement } from "./financial-element";
export { FinancialController } from "./financial-controller";
export { CandlestickElement } from "./candlestick-element";
export { CandlestickController } from "./candlestick-controller";

// Color utilities and themes
export {
  DEFAULT_FINANCIAL_COLORS,
  DARK_THEME_COLORS,
  LIGHT_THEME_COLORS,
  getFinancialColors,
  createVolumeColors
} from "./colors";

// Dataset and configuration factories
export {
  buildCandlestickDataset,
  buildVolumeDataset,
  buildFinancialChartOptions
} from "./factories";

// Registration mechanism
export {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from "./register-financial";
