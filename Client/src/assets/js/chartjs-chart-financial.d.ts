import {
  BarController,
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry,
  Chart,
  ChartComponent,
  ChartType,
  InteractionModeFunction,
} from 'chart.js';

import {
  CrosshairOptions
} from 'chartjs-plugin-crosshair'

declare module 'chart.js' {

  export interface FinancialDataPoint {
    x: number,
    o: number,
    h: number,
    l: number,
    c: number
  }

  interface FinancialParsedData {
    _custom?: any
  }

  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: {};
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    };
    ohlc: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: {};
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    }
  }

  // crosshair
  // https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/chartjs-plugin-crosshair
  interface PluginOptionsByType<TType extends ChartType> {
    crosshair?: CrosshairOptions | undefined;
  }

  interface InteractionModeMap {
    interpolate: InteractionModeFunction;
  }

  interface ChartDataSets {
    interpolate?: boolean | undefined;
  }
}

// MISSING CHART.JS TYPINGS (OVERRIDES)
// bug: https://github.com/chartjs/chartjs-chart-financial/pull/115

export interface CrosshairOptions {
  line?: LineOptions | undefined;
  sync?: SyncOptions | undefined;
  zoom?: ZoomOptions | undefined;
  snap?: SnapOptions | undefined;
  callbacks?: CallbackOptions | undefined;
}

export interface LineOptions {
  color?: string | undefined;
  width?: number | undefined;
  dashPattern?: number[] | undefined;
}

export interface SyncOptions {
  enabled?: boolean | undefined;
  group?: number | undefined;
  suppressTooltips?: boolean | undefined;
}

export interface ZoomOptions {
  enabled?: boolean | undefined;
  zoomboxBackgroundColor?: string | undefined;
  zoomboxBorderColor?: string | undefined;
  zoomButtonText?: string | undefined;
  zoomButtonClass?: string | undefined;
}

export interface SnapOptions {
  enabled?: boolean | undefined;
}

export interface CallbackOptions {
  beforeZoom?: ((start: number, end: number) => boolean) | undefined;
  afterZoom?: ((start: number, end: number) => void) | undefined;
}

type CandleDatasetOption = BarControllerDatasetOptions & {
  borderColor: {
    up: string,
    down: string,
    unchanged: string
  };
}

declare const CandlestickController: ChartComponent & {
  prototype: BarController;
  new(chart: Chart, datasetIndex: number): BarController;
};

declare const OhlcController: ChartComponent & {
  prototype: BarController;
  new(chart: Chart, datasetIndex: number): BarController;
};

declare const CandlestickElement: Element;
declare const OhlcElement: Element;
