/**
 * Financial charts module for Chart.js
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * 
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

// Types
export { FinancialDataPoint, FinancialParsedData } from "./types/financial-data-point";

// Elements
export { FinancialElement } from "./elements/financial-element";
export { CandlestickElement } from "./elements/candlestick-element";
export { OhlcElement } from "./elements/ohlc-element";

// Controllers
export { FinancialController } from "./controllers/financial-controller";
export { CandlestickController } from "./controllers/candlestick-controller";
export { OhlcController } from "./controllers/ohlc-controller";

// Utilities
export { 
  FINANCIAL_COLORS, 
  FinancialColorConfig, 
  createFinancialColorCallback, 
  createDefaultFinancialColors 
} from "./colors";

export {
  CandlestickDatasetOptions,
  VolumeDatasetOptions,
  createCandlestickDataset,
  createVolumeDataset,
  createFinancialChartOptions,
  createLargeDatasetChartOptions
} from "./factories";

// Registration
export { 
  ensureFinancialChartsRegistered, 
  isFinancialChartsRegistered, 
  resetRegistrationState 
} from "./register-financial";

// Import type augmentation
import "./financial-chart.registry.d";