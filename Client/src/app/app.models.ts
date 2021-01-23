
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

export class IndicatorType {
    constructor(
        public code: string,
        public name: string
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


// INDICATOR CONFIGS

export class BollingerBandConfig {
    constructor(
        public label: string,
        public lookbackPeriod: number,
        public standardDeviations: number
    ) { }
}

export class ParabolicSarConfig {
    constructor(
        public label: string,
        public accelerationStep: number,
        public maxAccelerationFactor: number
    ) { }
}

export class RsiConfig {
    constructor(
        public label: string,
        public lookbackPeriod: number
    ) { }
}

export class StochConfig {
    constructor(
        public label: string,
        public lookbackPeriod: number,
        public signalPeriod: number
    ) { }
}


// INDICATOR RESULTS

export class BollingerBandResult {
    constructor(
        public date: Date,
        public sma: number,
        public upperBand: number,
        public lowerBand: number
    ) { }
}

export class EmaResult {
    constructor(
        public date: Date,
        public ema: number
    ) { }
}

export class ParabolicSarResult {
    constructor(
        public date: Date,
        public sar: number
    ) { }
}

export class RsiResult {
    constructor(
        public date: Date,
        public rsi: number
    ) { }
}

export class StochResult {
    constructor(
        public date: Date,
        public oscillator: number,
        public signal: number
    ) { }
}
