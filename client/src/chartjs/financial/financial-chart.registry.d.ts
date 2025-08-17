/**
 * Financial Chart Type Registry
 * 
 * Augments Chart.js ChartTypeRegistry with financial chart types
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";

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

interface FinancialColorConfig {
  up: string;
  down: string;
  unchanged: string;
}

interface FinancialElementDefaults {
  color: FinancialColorConfig;
}

interface CandlestickElementDefaults extends FinancialElementDefaults {
  borderColor: string | FinancialColorConfig;
  borderWidth: number;
}

interface OhlcElementDefaults extends FinancialElementDefaults {
  lineWidth: number;
  armLength: number | null;
  armLengthRatio: number;
}

declare module "chart.js" {
  interface ElementOptionsByType<TType extends keyof ChartTypeRegistry> {
    financial: FinancialElementDefaults;
    candlestick: CandlestickElementDefaults;
    ohlc: OhlcElementDefaults;
  }

  interface Defaults {
    financial: any;
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
    };
  }
}