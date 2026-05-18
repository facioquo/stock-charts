import { ChartSettings } from "./types";

/**
 * Theme-aware color palette for chart UI elements (axis labels, annotations, grid).
 * Ensures consistent styling across light and dark themes for end-user visualization.
 */
export interface ThemeColors {
  /** Text color for axis labels and annotations */
  text: string;
  /** Background color for axis label and annotation backgrounds */
  background: string;
  /** Grid line color */
  grid: string;
}

/**
 * Get theme-consistent colors for UI elements.
 *
 * @param settings - Chart settings containing theme preference
 * @returns Color palette with text, background, and grid colors
 *
 * @example
 * const colors = getThemeColors({ isDarkTheme: true, showTooltips: true });
 * // returns { text: '#9E9E9E', background: '#12131680', grid: '#2E2E2E' }
 */
export function getThemeColors(settings: ChartSettings): ThemeColors {
  return settings.isDarkTheme ? DARK_COLORS : LIGHT_COLORS;
}

const LIGHT_COLORS: ThemeColors = {
  text: "#121316",
  background: "#FAF9FD90",
  grid: "#E0E0E0"
};

const DARK_COLORS: ThemeColors = {
  text: "#9E9E9E",
  background: "#12131680",
  grid: "#2E2E2E"
};
