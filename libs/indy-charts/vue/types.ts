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
}

export interface IndyChartsVueOptions {
  api: IndyChartsVueApiOptions;
  defaults?: IndyChartsVueDefaults;
  theme?: IndyChartsVueThemeOptions;
  indicators?: StockIndicatorChartRegistry;
}

export interface StockIndicatorChartProps {
  indicator?: string;
  config?: StockIndicatorChartConfig;
  barCount?: number;
}

export type StockIndicatorChartPhase = "idle" | "loading" | "ready" | "empty" | "error";

export function chartSettingsFromOptions(
  options: IndyChartsVueOptions,
  isDarkTheme: boolean
): ChartSettings {
  return {
    isDarkTheme,
    showTooltips: options.defaults?.showTooltips ?? true
  };
}
