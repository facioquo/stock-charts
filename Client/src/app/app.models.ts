import { Chart, ScatterDataPoint } from "chart.js";

export class Quote {
    constructor(
        public date: Date,
        public open: number,
        public high: number,
        public low: number,
        public close: number,
        public volume: number
    ) { }
}

// VARIANTS

export class IndicatorSelection {
    constructor(
        public ucid: string,
        public uiid: string,
        public label: string,
        public params?: IndicatorParam[],
        public results?: IndicatorResult[],
        public chart?: Chart
    ) { }
}

export class IndicatorParam {
    constructor(
        public queryString: string
    ) { }
}

export class IndicatorResult {
    constructor(
        public label: string,
        public dataName: string,
        public color: string,
        public data?: {
            x:number, 
            y:number
        }[]
    ) { }
}

// LISTING

export class IndicatorListing {
    constructor(
        public name: string,
        public uiid: string,
        public labelTemplate: string,
        public endpoint: string,
        public category: string,
        public chartType: string,
        public chartConfig: ChartConfig,
        public parameters: IndicatorParamConfig[],
        public results: IndicatorResultConfig[]
    ) { }
}

export class IndicatorParamConfig {
    constructor(
        public displayName: string,
        public paramName: string,
        public dataType: string,
        public order: number,
        public required: boolean,
        public defaultValue: number,
        public minimum: number,
        public maximum: number
    ) { }
}

export class IndicatorResultConfig {
    constructor(
        public legendTemplate: string,
        public dataName: string,
        public dataType: string,
        public lineType: string,
        public defaultColor: string,
        public altChartType: string,
        public altChartConfig: ChartConfig
    ) { }
}

export class ChartConfig {
    constructor(
        public minimumYAxis: number,
        public maximumYAxis: number,
        public thresholds: ChartThreshold[]
    ) { }
}

export class ChartThreshold {
    constructor(
        public value: number,
        public color: string,
        public style: string
    ) { }
}
