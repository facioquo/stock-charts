// types for chartjs-chart-financial

import {
  BarController,
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry,
  Chart,
  ChartComponent
} from "chart.js";

export interface FinancialDataPoint {
  x: number,
  o: number,
  h: number,
  l: number,
  c: number
}

declare module "chart.js" {

  interface FinancialParsedData {
    _custom?: unknown
  }

  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: Record<string, never>;
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    };
    ohlc: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: Record<string, never>;
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    }
  }
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
