import { BarControllerDatasetOptions, Chart, ScatterDataPoint } from "chart.js";

export interface Quote {
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

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



// MISSING CHART.JS TYPINGS (OVERRIDES)
// bug: https://github.com/chartjs/chartjs-chart-financial/pull/115
type CandleDatasetOption = BarControllerDatasetOptions & {
    borderColor: {
        up: string,
        down: string,
        unchanged: string
    };
}
