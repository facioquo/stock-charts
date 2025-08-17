// chartjs-chart-financial type augmentation
// based on https://github.com/chartjs/chartjs-chart-financial
// Augments Chart.js ChartTypeRegistry with financial chart types

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";
import { FinancialDataPoint, FinancialParsedData } from "./types";

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
