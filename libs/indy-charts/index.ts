/**
 * @facioquo/indy-charts - Framework-agnostic financial charting library
 *
 * Provides a complete charting solution for financial indicators with candlestick/OHLC
 * overlays and oscillator subcharts. Built on Chart.js v4+ with TypeScript strict mode.
 *
 * ## Quick Start
 *
 * ```ts
 * import { setupIndyCharts, ChartManager, createDefaultSelection } from '@facioquo/indy-charts';
 *
 * // One-time setup
 * setupIndyCharts();
 *
 * // Create a chart manager
 * const manager = new ChartManager({ settings: defaultChartSettings });
 *
 * // Initialize overlay (candlestick) chart
 * manager.initializeOverlay(canvas, quotes, 100);
 *
 * // Add indicator overlays
 * const selection = createDefaultSelection();
 * manager.addOverlayIndicators(selection);
 *
 * // Handle viewport changes
 * manager.setBarCount(newBarCount);
 * ```
 *
 * ## Architecture
 *
 * ### ChartManager
 * Central orchestrator for chart lifecycle:
 * - `initializeOverlay(ctx, quotes, barCount)` - Create candlestick/OHLC overlay chart
 * - `addOverlayIndicators(selection)` - Add technical indicators to overlay
 * - `addOscillator(selection)` - Create separate oscillator subchart
 * - `setBarCount(count)` - Update viewport window (triggers oscillator pre-slicing)
 * - `updateTheme(settings)` - Apply theme changes to all charts
 * - `destroy()` - Clean up all chart resources
 *
 * ### Key Patterns
 *
 * **Pre-slicing Optimization**: Oscillators receive pre-sliced datasets matching the
 * current viewport window during initialization. This ensures Chart.js calculates correct
 * axis bounds from day-one, avoiding axis recalculation when data changes. On viewport
 * resize, `applySlicedData()` updates oscillator datasets synchronously (mode="none")
 * for immediate responsive updates.
 *
 * **Type Safety**: All public APIs use strict TypeScript types. The library exports types
 * for Quote, IndicatorSelection, ChartSettings, etc. enabling type-safe application code.
 *
 * **Theme Management**: Themes are immutable and applied globally. Call `updateTheme()`
 * to propagate color/styling changes to all active charts. Per-instance background colors
 * are preserved across theme updates.
 *
 * ## Exports
 *
 * ### Setup
 * - `setupIndyCharts()` - Register Chart.js components and financial chart types
 *
 * ### Charts
 * - `ChartManager` - Main orchestrator class
 * - `OverlayChart` - Candlestick/OHLC overlay implementation
 * - `OscillatorChart` - Oscillator subchart implementation
 *
 * ### Configuration
 * - `ChartSettings` - Theme colors and styling
 * - `IndicatorSelection` - Selected indicators with thresholds
 * - `IndicatorListing` - Available indicators and their configurations
 * - `ChartConfig` - Per-indicator chart customization (thresholds, y-axis bounds)
 *
 * ### Helpers
 * - `calculateOptimalBars(width)` - Compute bar count for viewport width
 * - `createDefaultSelection()` - Create initial indicator selection
 * - `applySelectionTokens()` - Apply visual styling to selections
 *
 * ### API
 * - `createApiClient(config)` - Create HTTP client for backend
 * - `ApiClient` - Lightweight fetch-based HTTP client
 * - `loadStaticQuotes()` - Load pre-packaged backup quotes
 *
 * ## Performance Considerations
 *
 * - **Large Datasets**: For 5k-10k+ candlesticks, disable Chart.js animations and use
 *   non-intersecting tooltip mode. The library pre-sizes to 250-bar maximum by default.
 * - **Memory**: Pre-slicing reduces Chart.js dataset clones; only visible range is rendered
 * - **Responsive**: Viewport resizing updates oscillators synchronously (no animation delays)
 *
 * ## Browser Support
 *
 * Requires modern browser with ES2020+ support. Chart.js and chartjs-plugin-annotation
 * handle the heavy lifting across browsers.
 */

// Setup helper
export { setupIndyCharts } from "./setup";

// Indy-specific config types
export type {
  ChartConfig,
  ChartFill,
  ChartSettings,
  ChartThreshold,
  ExtendedChartDataset,
  IndicatorDataRow,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Quote,
  ThemeColors
} from "./config";

export {
  baseChartOptions,
  baseDataset,
  baseOscillatorConfig,
  baseOscillatorOptions,
  baseOverlayConfig,
  baseOverlayOptions,
  commonLegendAnnotation,
  defaultXAxisOptions,
  FONT_FAMILY,
  getThemeColors
} from "./config";

// Chart abstractions
export { ChartManager, OverlayChart, OscillatorChart } from "./charts";
export type { ChartManagerConfig } from "./charts";

// API client
export { createApiClient, loadStaticQuotes, loadStaticIndicatorData } from "./api";
export type { ApiClient, ApiClientConfig } from "./api";

// Selection and sizing helpers
export { applySelectionTokens, calculateOptimalBars, createDefaultSelection } from "./helpers";
