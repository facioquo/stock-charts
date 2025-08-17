/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from 'chart.js';

export interface FinancialDataPoint {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface FinancialParsedData {
  _custom?: unknown;
}

declare module 'chart.js' {
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
    };
  }
}