// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// Color configuration and theming utilities for financial charts

import type { FinancialColorConfig } from "./types";

/**
 * Default color configuration for financial charts
 */
export const DEFAULT_FINANCIAL_COLORS: FinancialColorConfig = {
  up: "rgba(80, 160, 115, 1)", // Green for price increase
  down: "rgba(215, 85, 65, 1)", // Red for price decrease
  unchanged: "rgba(90, 90, 90, 1)" // Gray for no change
};

/**
 * Dark theme color configuration
 */
export const DARK_THEME_COLORS: FinancialColorConfig = {
  up: "rgba(76, 175, 80, 1)", // Material Green 500
  down: "rgba(244, 67, 54, 1)", // Material Red 500
  unchanged: "rgba(158, 158, 158, 1)" // Material Gray 500
};

/**
 * Light theme color configuration
 */
export const LIGHT_THEME_COLORS: FinancialColorConfig = {
  up: "rgba(46, 125, 50, 1)", // Material Green 800
  down: "rgba(198, 40, 40, 1)", // Material Red 800
  unchanged: "rgba(97, 97, 97, 1)" // Material Gray 600
};

/**
 * Get color configuration for a theme
 */
export function getFinancialColors(
  theme: "light" | "dark" | "default" = "default"
): FinancialColorConfig {
  switch (theme) {
    case "light":
      return LIGHT_THEME_COLORS;
    case "dark":
      return DARK_THEME_COLORS;
    default:
      return DEFAULT_FINANCIAL_COLORS;
  }
}

/**
 * Create volume colors array based on price movement
 */
export function createVolumeColors(
  priceData: Array<{ o: number; c: number }>,
  theme: "light" | "dark" | "default" = "default"
): string[] {
  const colors = getFinancialColors(theme);
  return priceData.map(point => {
    if (point.c > point.o) {
      return colors.up;
    } else if (point.c < point.o) {
      return colors.down;
    } else {
      return colors.unchanged;
    }
  });
}
