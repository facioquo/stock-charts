// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// TypeScript port for modular integration

import { ChartComponent, Element } from "chart.js";
import type { BarController, Chart } from "chart.js";

/**
 * Financial data point interface for OHLC data
 */
export interface FinancialDataPoint {
  x: number;
  y?: number; // optional y coordinate for compatibility
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
  new (chart: Chart, datasetIndex: number): BarController;
};

export type OhlcControllerType = ChartComponent & {
  prototype: BarController;
  new (chart: Chart, datasetIndex: number): BarController;
};

export type FinancialElementType = Element;

/**
 * Chart.js tooltip context for financial data
 */
export interface FinancialTooltipContext {
  parsed: FinancialDataPoint;
  datasetIndex: number;
  dataIndex: number;
  label: string;
  formattedValue: string;
}

/**
 * Scale with internal properties
 */
export interface ScaleWithInternals {
  _startPixel?: number;
  _endPixel?: number;
  _length?: number;
  axis?: string;
}

/**
 * Controller with internal properties
 */
export interface ControllerWithInternals extends BarController {
  _getStackCount(): number;
  options: {
    barThickness?: number;
    categoryPercentage: number;
    barPercentage: number;
  };
  _calculateBarIndexPixels(
    index: number,
    ruler: unknown,
    options: Record<string, unknown>
  ): {
    center: number;
    size: number;
  };
  _getSharedOptions(
    start: number,
    mode: string
  ): {
    sharedOptions?: Record<string, unknown>;
    includeOptions: boolean;
  };
  resolveDataElementOptions(index: number, mode: string): Record<string, unknown>;
  updateElement(
    element: { options?: Record<string, unknown> },
    index: number,
    properties: Record<string, unknown>,
    mode: string
  ): void;
}

/**
 * Generic controller type for type safety
 */
export type ControllerType = ControllerWithInternals;

/**
 * Ruler configuration interface
 */
export interface RulerConfig {
  min: number;
  pixels: number[];
  start: number;
  end: number;
  stackCount: number;
  scale: unknown;
  ratio: number;
}
