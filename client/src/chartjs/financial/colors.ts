// Financial chart color utilities and callbacks
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { FinancialDataPoint, FinancialColorOptions } from "./types";

/**
 * Default financial chart colors
 */
export const FINANCIAL_COLORS = {
  CANDLESTICK: {
    up: "rgba(80, 160, 115, 1)",     // Green for bullish candles
    down: "rgba(215, 85, 65, 1)",    // Red for bearish candles
    unchanged: "rgba(90, 90, 90, 1)" // Gray for unchanged
  },
  VOLUME: {
    up: "rgba(80, 160, 115, 0.6)",   // Semi-transparent green
    down: "rgba(215, 85, 65, 0.6)",  // Semi-transparent red
    unchanged: "rgba(90, 90, 90, 0.6)" // Semi-transparent gray
  }
} as const;

/**
 * Creates a color callback function that returns appropriate colors based on open/close values
 */
export function createFinancialColorCallback(
  colors: FinancialColorOptions
): (context: any) => string {
  return (context: any): string => {
    const data = context.parsed || context.raw;
    if (!data || typeof data.o === "undefined" || typeof data.c === "undefined") {
      return colors.unchanged || FINANCIAL_COLORS.CANDLESTICK.unchanged;
    }

    const { o: open, c: close } = data;
    if (close > open) {
      return colors.up || FINANCIAL_COLORS.CANDLESTICK.up;
    } else if (close < open) {
      return colors.down || FINANCIAL_COLORS.CANDLESTICK.down;
    } else {
      return colors.unchanged || FINANCIAL_COLORS.CANDLESTICK.unchanged;
    }
  };
}

/**
 * Creates a volume color callback based on price movement
 */
export function createVolumeColorCallback(
  data: FinancialDataPoint[]
): (context: any) => string {
  return (context: any): string => {
    const index = context.dataIndex;
    if (!data[index] || typeof data[index].o === "undefined" || typeof data[index].c === "undefined") {
      return FINANCIAL_COLORS.VOLUME.unchanged;
    }

    const { o: open, c: close } = data[index];
    if (close > open) {
      return FINANCIAL_COLORS.VOLUME.up;
    } else if (close < open) {
      return FINANCIAL_COLORS.VOLUME.down;
    } else {
      return FINANCIAL_COLORS.VOLUME.unchanged;
    }
  };
}

/**
 * Determines if a candle is bullish (close > open)
 */
export function isBullish(dataPoint: FinancialDataPoint): boolean {
  return dataPoint.c > dataPoint.o;
}

/**
 * Determines if a candle is bearish (close < open)
 */
export function isBearish(dataPoint: FinancialDataPoint): boolean {
  return dataPoint.c < dataPoint.o;
}

/**
 * Determines if a candle is unchanged (close === open)
 */
export function isUnchanged(dataPoint: FinancialDataPoint): boolean {
  return dataPoint.c === dataPoint.o;
}

/**
 * Creates a color array for volume bars based on financial data
 */
export function createVolumeColors(data: FinancialDataPoint[]): string[] {
  return data.map(item => {
    if (item.c > item.o) {
      return FINANCIAL_COLORS.VOLUME.up;
    } else if (item.c < item.o) {
      return FINANCIAL_COLORS.VOLUME.down;
    } else {
      return FINANCIAL_COLORS.VOLUME.unchanged;
    }
  });
}