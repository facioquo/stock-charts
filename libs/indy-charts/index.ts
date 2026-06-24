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
 * // Build a selection from a listing, populate its datasets, and display it
 * const selection = createDefaultSelection(listing);
 * manager.processSelectionData(selection, listing, indicatorRows);
 * manager.displaySelection(selection, listing);
 *
 * // For oscillator indicators, also create the dedicated subchart
 * // manager.createOscillator(oscillatorCanvas, selection, listing);
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
 * - `processSelectionData(selection, listing, rows)` - Build datasets for a selection
 * - `displaySelection(selection, listing)` - Add overlay indicator datasets to the
 *   overlay chart and register the selection so window/theme updates apply to it
 * - `createOscillator(ctx, selection, listing)` - Create a separate oscillator subchart
 *   (call after `displaySelection` so window updates can re-slice it)
 * - `setBarCount(count)` - Update viewport window (re-slices overlay indicators and oscillators)
 * - `updateTheme(settings)` - Apply theme changes to all charts
 * - `removeSelection(ucid)` - Remove a selection and tear down its chart
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
 * for Bar, IndicatorSelection, ChartSettings, etc. enabling type-safe application code.
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
 * - `createDefaultSelection(listing, paramOverrides?, idPrefix?)` - Build an
 *   `IndicatorSelection` seeded from a listing's defaults and optional overrides
 * - `applySelectionTokens(selection)` - Apply legend/tooltip token styling to a selection
 *
 * ### API
 * - `createApiClient(config)` - Create a lightweight `fetch`-based `ApiClient`
 * - `ApiClient` - Interface exposing `getQuotes`, `getListings`, `getSelectionData`
 * - `loadStaticQuotes(quotes)` - Accept `Bar[]` (string or Date timestamps), return `Bar[]` with timestamps as Date
 * - `loadStaticIndicatorData(rows)` - Pass-through helper for `IndicatorDataRow[]`
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
  IndicatorDataset,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Bar,
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
