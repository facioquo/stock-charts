// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

// Financial chart type registry augmentation
// This file augments the Chart.js ChartTypeRegistry to include candlestick and ohlc chart types

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";

export interface FinancialDataPoint {
  x: number;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

export interface FinancialParsedData {
  _custom?: unknown;
}

declare module "chart.js" {
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