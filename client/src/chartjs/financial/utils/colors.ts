/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

export interface FinancialColorScheme {
  up: string;
  down: string;
  unchanged: string;
}

/**
 * Default financial color scheme
 */
export const DEFAULT_FINANCIAL_COLORS: FinancialColorScheme = {
  up: 'rgba(80, 160, 115, 1)',
  down: 'rgba(215, 85, 65, 1)',
  unchanged: 'rgba(90, 90, 90, 1)'
};

/**
 * Alternative green/red color scheme
 */
export const GREEN_RED_COLORS: FinancialColorScheme = {
  up: '#00C851',
  down: '#FF4444',
  unchanged: '#666666'
};

/**
 * Dark theme compatible color scheme
 */
export const DARK_THEME_COLORS: FinancialColorScheme = {
  up: '#4CAF50',
  down: '#F44336',
  unchanged: '#9E9E9E'
};

/**
 * Generates volume bar colors based on price movement
 */
export function generateVolumeColors(
  quotes: Array<{ open: number; close: number }>,
  colorScheme: FinancialColorScheme = DEFAULT_FINANCIAL_COLORS
): string[] {
  return quotes.map(quote => {
    if (quote.close > quote.open) {
      return colorScheme.up;
    } else if (quote.close < quote.open) {
      return colorScheme.down;
    } else {
      return colorScheme.unchanged;
    }
  });
}

/**
 * Creates a color callback function for candlestick datasets
 */
export function createCandlestickColorCallback(
  colorScheme: FinancialColorScheme = DEFAULT_FINANCIAL_COLORS
) {
  return (ctx: any) => {
    const dataPoint = ctx.parsed;
    if (!dataPoint) return colorScheme.unchanged;
    
    if (dataPoint.c > dataPoint.o) {
      return colorScheme.up;
    } else if (dataPoint.c < dataPoint.o) {
      return colorScheme.down;
    } else {
      return colorScheme.unchanged;
    }
  };
}

/**
 * Creates border color configuration for financial elements
 */
export function createFinancialBorderColors(
  colorScheme: FinancialColorScheme = DEFAULT_FINANCIAL_COLORS
): FinancialColorScheme {
  return {
    up: colorScheme.up,
    down: colorScheme.down,
    unchanged: colorScheme.unchanged
  };
}