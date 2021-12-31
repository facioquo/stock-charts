import { BarControllerDatasetOptions, Chart, ScatterDataPoint } from "chart.js";

// SELECTIONS

export interface IndicatorSelection {
  ucid: string,
  uiid: string,
  label: string,
  params?: IndicatorParam[],
  results?: IndicatorResult[],
  chart?: Chart
}

export interface IndicatorParam {
  queryString: string
}

export interface IndicatorResult {
  label?: string,
  color: string,
  dataName: string,
  type: string,
  data: ScatterDataPoint[]
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
