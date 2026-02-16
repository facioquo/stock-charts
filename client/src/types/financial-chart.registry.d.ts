/*
 * Financial chart registry augmentation for Chart.js.
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";

import type { FinancialDataPoint, FinancialParsedData } from "../chartjs/financial";

declare module "chart.js" {
  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      parsedDataType: FinancialParsedData;
      metaExtensions: Record<string, never>;
      scales: keyof CartesianScaleTypeRegistry;
    };
    ohlc: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      parsedDataType: FinancialParsedData;
      metaExtensions: Record<string, never>;
      scales: keyof CartesianScaleTypeRegistry;
    };
  }
}

export {};
