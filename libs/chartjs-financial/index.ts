// Chart.js controllers
export { CandlestickController } from "./controllers/candlestick.controller";
export { FinancialController } from "./controllers/financial.controller";
export { OhlcController } from "./controllers/ohlc.controller";

// Chart.js elements
export { CandlestickElement } from "./elements/candlestick.element";
export { FinancialElement } from "./elements/financial.element";
export { OhlcElement } from "./elements/ohlc.element";

// Factory functions for datasets and options
export {
  buildCandlestickDataset,
  buildVolumeDataset,
  toFinancialDataPoint
} from "./datasets";

export { applyFinancialElementTheme, buildFinancialChartOptions } from "./options";

// Registration
export { financialRegisterables, registerFinancialCharts } from "./register-financial";

// Theme and colors
export { COLORS, getCandleColor, getFinancialPalette, getVolumeColor } from "./theme/colors";

// Types
export type {
  FinancialColorSet,
  FinancialDataPoint,
  FinancialDatasetOptions,
  FinancialPalette,
  FinancialParsedData,
  FinancialThemeMode,
  OhlcDatasetOptions
} from "./types/financial.types";
