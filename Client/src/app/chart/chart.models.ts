import {
  BarControllerDatasetOptions,
  Chart,
  ChartDataset
} from "chart.js";

export interface Quote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// LISTING

export interface IndicatorListing {
  name: string;
  uiid: string;
  legendTemplate: string;
  endpoint: string;
  category: string;
  chartType: string;
  order: number,
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
  stack: string,
  lineWidth: number;
  defaultColor: string;
  fill: ChartFill;
  order: number
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
  fill: ChartFill;
}

export interface ChartFill {
  target: string,
  colorAbove: string,
  colorBelow: string
}

// SELECTIONS

export interface IndicatorSelection {
  ucid: string,
  uiid: string,
  label: string,
  chartType: string,
  params: IndicatorParam[],
  results: IndicatorResult[],
  chart?: Chart
}

export interface IndicatorParam {
  paramName: string,
  displayName: string,
  minimum: number,
  maximum: number,
  value?: number
}

export interface IndicatorResult {
  label: string,
  displayName: string,
  dataName: string,
  color: string,
  lineType: string,
  lineWidth: number,
  order: number,
  dataset: ChartDataset
}

// MISSING CHART.JS TYPINGS (OVERRIDES)
// bug: https://github.com/chartjs/chartjs-chart-financial/pull/115
type CandleDatasetOption = BarControllerDatasetOptions & {
  borderColor: {
    up: string,
    down: string,
    unchanged: string
  };
}
