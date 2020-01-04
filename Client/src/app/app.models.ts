
export class Quote {
    constructor(
        public date: Date,
        public open: number,
        public high: number,
        public low: number,
        public close: number,
        public volume: number,
    ) { }
}


export class IndicatorType {
    constructor(
        public code: string,
        public name: string,
    ) { }
}

export class IndicatorParameters {
    constructor(
        public color: string,
        public parameterOne: number,
        public parameterTwo?: number,
        public parameterThree?: number,
        public label?: string
    ) { }
}


// INDICATOR RESULTS

export class SmaResult {
    constructor(
        public date: Date,
        public sma: number,
    ) { }
}

export class EmaResult {
    constructor(
        public date: Date,
        public ema: number,
    ) { }
}

export class BollingerBandConfig {
    constructor(
        public id: number,
        public label: string,
        public lookbackPeriod: number,
        public standardDeviations: number
    ) { }
}

export class BollingerBandResult {
    constructor(
        public date: Date,
        public sma: number,
        public upperBand: number,
        public lowerBand: number
    ) { }
}
