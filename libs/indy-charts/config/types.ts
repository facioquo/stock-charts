import { type ChartDataset, type ScatterDataPoint } from "chart.js";

// CHARTS

/**
 * Indicator datasets are line or bar series of `{ x, y }` points. Pinning the
 * data shape lets callers (e.g. createThresholdDataset) read `dataset.data` as
 * `ScatterDataPoint[]` without casts, and keeps the shape consistent with
 * `buildDataPoints` / `addExtraBars` output.
 */
export type IndicatorDataset = ChartDataset<"line" | "bar", ScatterDataPoint[]>;

/**
 * Candlestick-pattern indicators set per-point style arrays
 * (`pointRotation`, `pointBackgroundColor`, `pointBorderColor`). These live on
 * Chart.js's "line" dataset only — the `"line" | "bar"` union in
 * IndicatorDataset narrows them away — so this extension re-adds them as
 * optional for the candlestick-pattern code path. Use IndicatorDataset for
 * everything else.
 */
export type ExtendedChartDataset = IndicatorDataset & {
  pointRotation?: number[];
  pointBackgroundColor?: string[];
  pointBorderColor?: string[];
};

/**
 * Single source of truth for an OHLCV bar, mirroring the
 * Skender.Stock.Indicators .NET `Quote` model. `timestamp` accepts either a
 * `Date` instance or an ISO 8601 string so the same type works for in-memory
 * data, JSON fixtures, and wire responses without a parallel "raw" type.
 * The library normalizes to `Date` at consumption sites that need date
 * arithmetic (see `data/transformers.ts`).
 */
export interface Quote {
  timestamp: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Indicator data row as returned by the API or supplied as a static fixture.
 * Carries a `timestamp` (string or Date) and an arbitrary set of indicator
 * result fields keyed by `dataName`. `candle` is populated on wire responses
 * and consumed only by the CANDLESTICK_PATTERN category; fixtures for other
 * indicators may omit it.
 */
export interface IndicatorDataRow {
  timestamp?: Date | string;
  candle?: Quote;
  [key: string]: unknown; // For dynamic indicator result values
}

// SETTINGS

export interface ChartSettings {
  isDarkTheme: boolean;
  showTooltips: boolean;
  /** Optional override for annotation and axis-label backdrop background color. */
  background?: string;
}

// LISTING

export interface IndicatorListing {
  name: string;
  uiid: string;
  legendTemplate: string;
  endpoint: string;
  category: string;
  chartType: string;
  order: number;
  chartConfig: ChartConfig | null;
  parameters: IndicatorParamConfig[];
  results: IndicatorResultConfig[];
}

export interface IndicatorParamConfig {
  displayName: string;
  paramName: string;
  dataType: string;
  defaultValue: number;
  minimum: number;
  maximum: number;
}

export interface IndicatorResultConfig {
  displayName: string;
  tooltipTemplate: string;
  dataName: string;
  dataType: string;
  lineType: string;
  /**
   * Piecewise-constant level line (e.g. monthly Pivot Points): the value is flat
   * within a window and steps at each boundary. When set, the line renders as a
   * separate horizontal segment per window — the boundary riser is hidden —
   * matching the reference rendering without inserting gap points. Absent
   * (false) for ordinary continuous series.
   */
  segmented?: boolean;
  stack: string;
  lineWidth: number | null;
  defaultColor: string;
  fill?: ChartFill | null;
  /**
   * Optional per-result z-order override (Chart.js dataset `order`: lower draws
   * on top, higher draws behind). The API does not currently emit this, so it is
   * absent in practice and the series falls back to the listing's `order` (the
   * z-order for the whole indicator). Present here for an eventual per-result
   * override without a breaking type change.
   */
  order?: number;
}

export interface ChartConfig {
  minimumYAxis: number | null;
  maximumYAxis: number | null;
  thresholds: ChartThreshold[];
}

export interface ChartThreshold {
  value: number;
  color: string;
  style: string;
  fill?: ChartFill | null;
}

export interface ChartFill {
  target: string;
  colorAbove: string;
  colorBelow: string;
}

// SELECTIONS

export interface IndicatorSelection {
  ucid: string;
  uiid: string;
  label: string;
  chartType: string;
  params: IndicatorParam[];
  results: IndicatorResult[];
}

export interface IndicatorParam {
  paramName: string;
  displayName: string;
  minimum: number;
  maximum: number;
  value?: number;
}

export interface IndicatorResult {
  label: string;
  displayName: string;
  dataName: string;
  color: string;
  lineType: string;
  lineWidth: number;
  order: number;
  dataset: IndicatorDataset;
}
