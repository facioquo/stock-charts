/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT (preserved attribution from upstream project).
 */

import type { BarControllerDatasetOptions } from "chart.js";

export interface FinancialDataPoint {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface FinancialColorSet {
  up: string;
  down: string;
  unchanged: string;
}

export interface FinancialPalette {
  candle: FinancialColorSet;
  candleBorder: FinancialColorSet;
  volume: FinancialColorSet;
}

export type FinancialThemeMode = "dark" | "light";

export interface FinancialParsedData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
  _custom?: unknown;
}

export type FinancialDatasetOptions = BarControllerDatasetOptions & {
  color?: FinancialColorSet;
  borderColor?: FinancialColorSet | string;
};

export type OhlcDatasetOptions = FinancialDatasetOptions & {
  lineWidth?: number;
  armLength?: number | null;
  armLengthRatio?: number;
};
