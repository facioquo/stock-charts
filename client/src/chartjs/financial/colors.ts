// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { FinancialColorConfig } from "./types";

/**
 * Default financial chart color configuration
 */
export const DEFAULT_FINANCIAL_COLORS: FinancialColorConfig = {
  up: "rgba(80, 160, 115, 1)",
  down: "rgba(215, 85, 65, 1)",
  unchanged: "rgba(90, 90, 90, 1)"
};

/**
 * Creates a financial color configuration
 * @param up Color for bullish/up candles
 * @param down Color for bearish/down candles
 * @param unchanged Color for unchanged/doji candles
 * @returns Financial color configuration
 */
export function createFinancialColors(
  up: string,
  down: string,
  unchanged?: string
): FinancialColorConfig {
  return {
    up,
    down,
    unchanged: unchanged || unchanged || DEFAULT_FINANCIAL_COLORS.unchanged
  };
}

/**
 * Gets the appropriate color based on open/close values
 * @param open Opening price
 * @param close Closing price
 * @param colors Color configuration
 * @returns The appropriate color for the candle
 */
export function getFinancialColor(
  open: number,
  close: number,
  colors: FinancialColorConfig
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
 * Common financial chart color schemes
 */
export const FINANCIAL_COLOR_SCHEMES = {
  /** Traditional red/green scheme */
  traditional: createFinancialColors("#22C55E", "#EF4444", "#6B7280"),
  
  /** Blue/orange scheme */
  modern: createFinancialColors("#3B82F6", "#F97316", "#6B7280"),
  
  /** High contrast scheme */
  highContrast: createFinancialColors("#000000", "#FFFFFF", "#808080"),
  
  /** Colorblind-friendly scheme */
  accessible: createFinancialColors("#0077BB", "#CC3311", "#999999")
} as const;