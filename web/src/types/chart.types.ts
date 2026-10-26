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

/** How the settings dialog lists available indicators: under category headings, or A to Z. */
export type ListingOrder = "category" | "name";

/** Settings the demo saves; the series legend choice is always set here. */
export interface UserSettings extends ChartSettings {
  showSeriesLegend: boolean;
  listingOrder: ListingOrder;
}
