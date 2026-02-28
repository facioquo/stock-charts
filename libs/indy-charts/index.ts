// Setup helper
export { setupIndyCharts } from "./setup";

// Indy-specific config types
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

export { commonLegendAnnotation } from "./config";

// Chart abstractions
export { ChartManager, OverlayChart, OscillatorChart } from "./charts";
export type { ChartManagerConfig } from "./charts";

// API client
export { createApiClient, loadStaticQuotes, loadStaticIndicatorData } from "./api";
export type { ApiClient, ApiClientConfig } from "./api";

// Selection and sizing helpers
export { applySelectionTokens, calculateOptimalBars, createDefaultSelection } from "./helpers";
