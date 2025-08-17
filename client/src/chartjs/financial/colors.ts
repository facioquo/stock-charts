/**
 * Financial chart color theming utilities
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

/**
 * Default financial chart colors
 */
export const FINANCIAL_COLORS = {
  /**
   * Color when closing price is higher than opening price (bullish)
   */
  UP: "rgba(80, 160, 115, 1)",

  /**
   * Color when closing price is lower than opening price (bearish)
   */
  DOWN: "rgba(215, 85, 65, 1)",

  /**
   * Color when closing price equals opening price (neutral)
   */
  UNCHANGED: "rgba(90, 90, 90, 1)"
} as const;

/**
 * Color configuration for financial elements
 */
export interface FinancialColorConfig {
  up: string;
  down: string;
  unchanged: string;
}

/**
 * Creates a color callback function for financial charts based on open/close comparison
 * @param colors - Color configuration object
 * @returns Function that returns appropriate color based on OHLC data
 */
export function createFinancialColorCallback(colors: FinancialColorConfig) {
  return (ctx: { parsed: { o: number; c: number } }) => {
    const { o: open, c: close } = ctx.parsed;
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
 * Creates default financial color configuration
 */
export function createDefaultFinancialColors(): FinancialColorConfig {
  return {
    up: FINANCIAL_COLORS.UP,
    down: FINANCIAL_COLORS.DOWN,
    unchanged: FINANCIAL_COLORS.UNCHANGED
  };
}
