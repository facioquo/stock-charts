/**
 * Chart.js type registry augmentation for financial chart types
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * 
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";
import { FinancialDataPoint, FinancialParsedData } from "./types/financial-data-point";

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