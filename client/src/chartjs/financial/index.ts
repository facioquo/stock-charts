/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

// Controllers
export { FinancialController } from './controllers/financial-controller';
export { CandlestickController } from './controllers/candlestick-controller';
export { OhlcController } from './controllers/ohlc-controller';

// Elements
export { FinancialElement } from './elements/financial-element';
export { CandlestickElement } from './elements/candlestick-element';
export { OhlcElement } from './elements/ohlc-element';

// Types
export type { FinancialDataPoint } from './financial-chart.registry';

// Registration
export {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from './register-financial';

// Utilities
export {
  type FinancialColorScheme,
  DEFAULT_FINANCIAL_COLORS,
  GREEN_RED_COLORS,
  DARK_THEME_COLORS,
  generateVolumeColors,
  createCandlestickColorCallback,
  createFinancialBorderColors
} from './utils/colors';

export {
  type CandlestickDatasetOptions,
  type VolumeDatasetOptions,
  type FinancialChartOptions,
  createCandlestickDataset,
  createVolumeDataset,
  createOhlcDataset,
  createFinancialChartConfig,
  convertToFinancialDataPoints,
  convertToVolumeDataPoints
} from './utils/factories';

