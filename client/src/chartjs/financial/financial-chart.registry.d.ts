// Type augmentation for Chart.js registry to include financial chart types
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";
import { FinancialDataPoint, FinancialParsedData, FinancialDatasetOptions } from "./types";

declare module "chart.js" {
  interface FinancialParsedData {
    _custom?: unknown;
  }

  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions & FinancialDatasetOptions;
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: Record<string, never>;
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    };
    ohlc: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions & FinancialDatasetOptions & {
        lineWidth?: number;
        armLength?: number | null;
        armLengthRatio?: number;
      };
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: Record<string, never>;
      parsedDataType: FinancialParsedData;
      scales: keyof CartesianScaleTypeRegistry;
    };
  }
}