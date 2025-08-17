/**
 * Financial Chart Colors and Dynamic Color Callbacks
 * 
 * Based on chartjs-chart-financial color patterns
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { FinancialDataPoint } from "./financial-chart.registry.d";

export interface FinancialColorConfig {
  up: string;
  down: string;
  unchanged: string;
}

/**
 * Default financial chart colors
 */
export const DEFAULT_FINANCIAL_COLORS: FinancialColorConfig = {
  up: "rgba(80, 160, 115, 1)",
  down: "rgba(215, 85, 65, 1)",
  unchanged: "rgba(90, 90, 90, 1)"
};

/**
 * Enhanced financial colors for better visual distinction
 */
export const ENHANCED_FINANCIAL_COLORS: FinancialColorConfig = {
  up: "#1B5E20",    // Green 800 - for bullish/rising prices
  down: "#B71C1C",  // Red 800 - for bearish/falling prices
  unchanged: "#616161" // Grey 700 - for unchanged prices
};

/**
 * Volume chart colors with transparency
 */
export const VOLUME_COLORS: FinancialColorConfig = {
  up: "#1B5E2060",   // Green with 60% opacity
  down: "#B71C1C60", // Red with 60% opacity
  unchanged: "#61616160" // Grey with 60% opacity
};

/**
 * Creates a dynamic color callback function for candlestick charts
 * Based on open/close price relationship
 */
export function createCandlestickColorCallback(
  colors: FinancialColorConfig = ENHANCED_FINANCIAL_COLORS
) {
  return function (context: any): string {
    const dataPoint = context.parsed as FinancialDataPoint;
    if (!dataPoint) return colors.unchanged;

    const { o: open, c: close } = dataPoint;
    
    if (close > open) {
      return colors.up;
    } else if (close < open) {
      return colors.down;
    } else {
      return colors.unchanged;
    }
  };
}

/**
 * Creates a dynamic color callback function for volume charts
 * Based on open/close price relationship with transparency
 */
export function createVolumeColorCallback(
  colors: FinancialColorConfig = VOLUME_COLORS
) {
  return function (context: any): string {
    const dataPoint = context.parsed as FinancialDataPoint;
    if (!dataPoint) return colors.unchanged;

    const { o: open, c: close } = dataPoint;
    
    if (close >= open) {
      return colors.up;
    } else {
      return colors.down;
    }
  };
}

/**
 * Creates a dynamic border color callback for candlestick charts
 */
export function createCandlestickBorderColorCallback(
  colors: FinancialColorConfig = ENHANCED_FINANCIAL_COLORS
) {
  return createCandlestickColorCallback(colors);
}

/**
 * Determines the appropriate color based on OHLC data
 */
export function getOhlcColor(
  open: number,
  close: number,
  colors: FinancialColorConfig = ENHANCED_FINANCIAL_COLORS
): string {
  if (close > open) {
    return colors.up;
  } else if (close < open) {
    return colors.down;
  } else {
    return colors.unchanged;
  }
}

/**
 * Batch processes an array of financial data points to determine colors
 */
export function processFinancialDataColors(
  dataPoints: FinancialDataPoint[],
  colors: FinancialColorConfig = ENHANCED_FINANCIAL_COLORS
): string[] {
  return dataPoints.map(point => getOhlcColor(point.o, point.c, colors));
}

/**
 * Color palette for chart theming integration
 */
export const FINANCIAL_CHART_COLORS = {
  DEFAULT: DEFAULT_FINANCIAL_COLORS,
  ENHANCED: ENHANCED_FINANCIAL_COLORS,
  VOLUME: VOLUME_COLORS
} as const;