// Config builders
export type {
  ChartConfig,
  ChartFill,
  ChartSettings,
  ChartThreshold,
  IndicatorDataRow,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Quote,
  RawQuote
} from "./config";

export {
  baseChartOptions,
  baseDataset,
  baseOscillatorConfig,
  baseOscillatorOptions,
  baseOverlayConfig,
  baseOverlayOptions,
  commonLegendAnnotation,
  createThresholdDataset,
  defaultXAxisOptions,
  FONT_FAMILY
} from "./config";

// Factory functions
export {
  buildCandlestickDataset,
  buildVolumeDataset,
  toFinancialDataPoint
} from "./factories/datasets";

export { applyFinancialElementTheme, buildFinancialChartOptions } from "./factories/options";

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

// Data transformers
export {
  addExtraBars,
  buildDataPoints,
  getCandlePointConfiguration,
  processQuoteData
} from "./data";

// Chart abstractions
export { ChartManager, OverlayChart, OscillatorChart } from "./charts";
export type { ChartManagerConfig } from "./charts";

// API client
export { createApiClient, loadStaticQuotes, loadStaticIndicatorData } from "./api";
export type { ApiClient, ApiClientConfig } from "./api";
