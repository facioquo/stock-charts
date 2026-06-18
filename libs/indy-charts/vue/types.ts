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
  /**
   * Companion indicator name(s) to compose into the same chart. Overlay-type
   * companions render on the shared price panel; oscillator-type companions
   * render as aligned panes beneath it. The `with` prop takes precedence.
   */
  with?: string | string[];
  /** Per-instance background color for annotation and axis-label backdrops. */
  background?: string;
}

export type StockIndicatorChartRegistry = Record<string, StockIndicatorChartConfig>;

export interface IndyChartsVueDefaults {
  indicator?: string;
  barCount?: number;
  quoteCount?: number;
  showTooltips?: boolean;
  showRightAxisLabels?: boolean;
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
   * the `data-testid` prefix (`stock-indicator-chart-<slug(id)>`). Resolution
   * order is `id` → `config.id` → `indicator`, with `undefined`/missing values
   * skipped (an empty string is treated as a present value and slugified to
   * the `"chart"` fallback). Use this to mount multiple instances of the same
   * indicator on a single page with distinct test/CSS hooks. Treat as
   * effectively set-once: the DOM `id`/`data-testid` updates immediately on
   * change, but internal selection tokens are namespaced at chart-creation
   * time and retain the previous prefix until the chart reloads for an
   * unrelated reason.
   */
  id?: string;
  config?: StockIndicatorChartConfig;
  barCount?: number;
  withOverlay?: boolean;
  /**
   * Companion indicator name(s) to compose into the same chart under one
   * `ChartManager`, sharing the price panel's windowed x-axis. Overlay-type
   * companions render on the price panel; oscillator-type companions render as
   * vertically aligned panes beneath it. Accepts a single name or an array.
   *
   * Example: `<StockIndicatorChart indicator="bb" with="bbPctB" />` renders the
   * Bollinger Bands overlay on the price panel and the %B oscillator aligned
   * below it. Takes precedence over `config.with`.
   */
  with?: string | string[];
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
    showRightAxisLabels: options.defaults?.showRightAxisLabels ?? false,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional: treats empty string as absent (consistent with getThemeColors falsy check)
    background: background || themeBg
  };
}
