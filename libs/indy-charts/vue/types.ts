import type { ApiClientConfig } from "../api";
import type { ChartSettings } from "../config";

export type IndyChartsVueApiOptions = ApiClientConfig;

export interface StockIndicatorChartConfig {
  id?: string;
  uiid?: string;
  title?: string;
  params?: Record<string, number>;
  results?: string[];
  barCount?: number;
  quoteCount?: number;
  /** Per-instance background color for annotation and axis-label backdrops. */
  background?: string;
}

export type StockIndicatorChartRegistry = Record<string, StockIndicatorChartConfig>;

export interface IndyChartsVueDefaults {
  indicator?: string;
  barCount?: number;
  quoteCount?: number;
  showTooltips?: boolean;
}

export interface IndyChartsVueThemeOptions {
  isDarkTheme?: boolean;
  /** When `true`, syncs the chart theme with VitePress's dark mode toggle. */
  observeVitePressDarkMode?: boolean;
  /** Background color used for annotation and axis-label backdrops in dark mode. */
  darkBackground?: string;
  /** Background color used for annotation and axis-label backdrops in light mode. */
  lightBackground?: string;
}

export interface IndyChartsVueOptions {
  api: IndyChartsVueApiOptions;
  defaults?: IndyChartsVueDefaults;
  theme?: IndyChartsVueThemeOptions;
  indicators?: StockIndicatorChartRegistry;
}

export interface StockIndicatorChartProps {
  indicator?: string;
  /**
   * Stable identifier for this chart instance. Drives the root element id and
   * the `data-testid` prefix (`stock-indicator-chart-<slug(id)>`). Overrides
   * `config.id` and falls back to `indicator` when omitted. Use this to mount
   * multiple instances of the same indicator on a single page with distinct
   * test/CSS hooks.
   */
  id?: string;
  config?: StockIndicatorChartConfig;
  barCount?: number;
  withOverlay?: boolean;
  /** Per-instance background color for annotation and axis-label backdrops. */
  background?: string;
}

export type StockIndicatorChartPhase = "idle" | "loading" | "ready" | "empty" | "error";

export function chartSettingsFromOptions(
  options: IndyChartsVueOptions,
  isDarkTheme: boolean,
  background?: string
): ChartSettings {
  const themeBg = isDarkTheme ? options.theme?.darkBackground : options.theme?.lightBackground;
  return {
    isDarkTheme,
    showTooltips: options.defaults?.showTooltips ?? true,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional: treats empty string as absent (consistent with getThemeColors falsy check)
    background: background || themeBg
  };
}
