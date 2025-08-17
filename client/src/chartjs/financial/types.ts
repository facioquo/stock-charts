// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { BarControllerChartOptions, BarControllerDatasetOptions, CartesianScaleTypeRegistry } from "chart.js";

/**
 * Financial data point containing OHLC values
 */
export interface FinancialDataPoint {
  x: number;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

/**
 * Financial parsed data interface for Chart.js
 */
export interface FinancialParsedData {
  _custom?: unknown;
}

/**
 * Color configuration for financial elements
 */
export interface FinancialColorConfig {
  up: string;
  down: string;
  unchanged: string;
}

/**
 * Financial element properties
 */
export interface FinancialElementProps {
  x: number;
  y: number;
  base: number;
  width: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Bounds for financial elements
 */
export interface FinancialElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Chart type registry declarations for financial charts
 */
declare module "chart.js" {
  interface FinancialParsedData {
    _custom?: unknown;
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