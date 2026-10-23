import type { ChartSettings } from "@facioquo/indy-charts";

/**
 * Domain types are owned by `@facioquo/indy-charts` (framework-agnostic).
 * Re-exported here so app code imports from a single local barrel.
 */
export type {
  ChartSettings,
  IndicatorDataRow,
  IndicatorListing,
  IndicatorParam,
  IndicatorResult,
  IndicatorSelection,
  Bar
} from "@facioquo/indy-charts";

/** Settings the demo saves; the series legend choice is always set here. */
export type UserSettings = ChartSettings & { showSeriesLegend: boolean };
