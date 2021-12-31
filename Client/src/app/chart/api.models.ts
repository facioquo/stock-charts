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
  labelTemplate: string;
  endpoint: string;
  category: string;
  chartType: string;
  chartConfig: ChartConfig | null;
  parameters: IndicatorParamConfig[];
  results: IndicatorResultConfig[];
}

export interface IndicatorParamConfig {
  displayName: string;
  paramName: string;
  dataType: string;
  order: number;
  required: boolean;
  default: number;
  minimum: number;
  maximum: number;
}

export interface IndicatorResultConfig {
  legendTemplate: string;
  dataName: string;
  dataType: string;
  lineType: string;
  defaultColor: string;
  altChartType: null | string;
  altChartConfig: ChartConfig | null;
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
}
