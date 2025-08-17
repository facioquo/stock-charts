// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// TypeScript port for modular integration

import {
  BarController,
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry,
  ChartComponent,
  Element
} from "chart.js";

/**
 * Financial data point interface for OHLC data
 */
export interface FinancialDataPoint {
  x: number;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

/**
 * Financial parsed data interface
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
 * Financial element base interface
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
 * Controller type definitions
 */
export type CandlestickControllerType = ChartComponent & {
  prototype: BarController;
  new (chart: any, datasetIndex: number): BarController;
};

export type OhlcControllerType = ChartComponent & {
  prototype: BarController;
  new (chart: any, datasetIndex: number): BarController;
};

export type FinancialElementType = Element;
