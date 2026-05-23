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

export interface Quote {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorDataRow {
  /** Skender.Stock.Indicators v3+ field name */
  timestamp?: string;
  /** @deprecated Skender v2 field name — accepted for backward compatibility */
  date?: string;
  candle: Quote;
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
  stack: string;
  lineWidth: number | null;
  defaultColor: string;
  fill?: ChartFill | null;
  order: number;
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
