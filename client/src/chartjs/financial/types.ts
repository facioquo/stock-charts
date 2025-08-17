// Financial chart type definitions
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

export interface FinancialDataPoint {
  x: number | string | Date;
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
}

export interface FinancialParsedData {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
  _custom?: unknown;
}

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

export interface FinancialDatasetOptions {
  color?: string | FinancialColorOptions;
  borderColor?: string | FinancialColorOptions;
  borderWidth?: number;
  // Candlestick specific
  borderSkipped?: boolean | string;
  // OHLC specific
  lineWidth?: number;
  armLength?: number | null;
  armLengthRatio?: number;
}

export interface FinancialColorOptions {
  up?: string;
  down?: string;
  unchanged?: string;
}

export interface BarBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface FinancialRuler {
  min: number;
  pixels: number[];
  start: number;
  end: number;
  stackCount: number;
  scale: any; // Chart.js scale type
  ratio: number;
}