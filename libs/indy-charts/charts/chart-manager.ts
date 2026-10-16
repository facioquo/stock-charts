import { type ChartDataset } from "chart.js";

import {
  type ChartSettings,
  type ExtendedChartDataset,
  type IndicatorDataRow,
  type IndicatorDataset,
  type IndicatorListing,
  type IndicatorResult,
  type IndicatorResultConfig,
  type IndicatorSelection,
  type Bar
} from "../config/types";

import { baseDataset } from "../config/datasets";
import {
  buildDataPoints,
  buildFinancialDataPoints,
  addExtraBars,
  addExtraFinancialBars
} from "../data/transformers";
import { OverlayChart } from "./overlay-chart";
import { OscillatorChart } from "./oscillator-chart";
import { clampWindow, panWindow, zoomWindow, type BarWindow } from "./window";

const EXTRA_BARS = 6;

const CHART_TYPES = {
  OVERLAY: "overlay",
  OSCILLATOR: "oscillator"
} as const;

/**
 * Reserved cache key for the overlay's candlestick + volume datasets in
 * `_allProcessedDatasets`. No `IndicatorSelection.ucid` may collide with this
 * — a collision would mis-cast candlestick data as indicator data in
 * `applySlicedData`.
 */
const OVERLAY_MAIN_KEY = "overlay-main";

export interface ChartManagerConfig {
  settings: ChartSettings;
  extraBars?: number;
}

export class ChartManager {
  private _overlayChart: OverlayChart | undefined;
  private _oscillators = new Map<string, OscillatorChart>();
  private _selections: IndicatorSelection[] = [];
  private _allQuotes: Bar[] = [];
  private _allProcessedDatasets = new Map<string, ChartDataset[]>();
  private _currentBarCount = 250;
  /** Bars between the window's end and the newest bar; 0 anchors to the newest. */
  private _windowOffset = 0;
  private _settings: ChartSettings;
  private extraBars: number;

  /** Current chart settings. Update via updateTheme() to propagate to all charts. */
  get settings(): ChartSettings {
    return { ...this._settings };
  }

  /** Read-only access to the overlay chart instance. */
  get overlayChart(): OverlayChart | undefined {
    return this._overlayChart;
  }

  /** Read-only view of registered oscillator charts keyed by ucid. */
  get oscillators(): ReadonlyMap<string, OscillatorChart> {
    return this._oscillators;
  }

  /** Read-only view of registered indicator selections. */
  get selections(): ReadonlyArray<IndicatorSelection> {
    return this._selections;
  }

  /** Read-only view of the full quote dataset. */
  get allQuotes(): ReadonlyArray<Bar> {
    return this._allQuotes;
  }

  /** Current number of bars being displayed. */
  get currentBarCount(): number {
    return this._currentBarCount;
  }

  /**
   * Bars between the end of the visible window and the newest bar.
   * 0 means the window is anchored to the newest bar (the default).
   */
  get windowOffset(): number {
    return this._windowOffset;
  }

  /** History index of the first visible bar; the `start` argument `setWindow` takes. */
  get windowStart(): number {
    return this.sliceStart;
  }

  constructor(config: ChartManagerConfig) {
    this._settings = { ...config.settings };
    this.extraBars = config.extraBars ?? EXTRA_BARS;
  }

  /**
   * Initialize the overlay chart with quote data.
   * @param ctx - Canvas rendering context or canvas element
   * @param allQuotes - Full quote dataset
   * @param barCount - Number of bars to display initially
   */
  initializeOverlay(
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    allQuotes: Bar[],
    barCount: number
  ): void {
    this._allQuotes = allQuotes;
    this._currentBarCount = this.normalizeBarCount(barCount);
    this._windowOffset = 0;

    this._overlayChart?.destroy();
    this._overlayChart = new OverlayChart(ctx, this._settings);

    // Slice quotes to barCount so the chart is initialized with the visible
    // data range only. This gives Chart.js correct y-axis bounds from the
    // start, matching production behavior where charts always receive
    // pre-sliced data. Rendering with all historical quotes first causes
    // the y-axis to lock to the full price range (~$540–$950) even after
    // a subsequent applySlicedData() + chart.update() call.
    const slicedQuotes = allQuotes.slice(this.sliceStart);
    this._overlayChart.render(slicedQuotes, this.extraBars);

    // Build and store the full-history datasets separately so setBarCount()
    // can re-slice across the entire history without re-rendering the chart.
    const fullDatasets = this._overlayChart.buildFullDatasets(allQuotes, this.extraBars);
    this._allProcessedDatasets.set(OVERLAY_MAIN_KEY, fullDatasets);

    // Re-attach previously registered overlay selections so they survive
    // overlay re-initialization (e.g., theme/canvas reset). Without this,
    // displaySelection() would silently skip these (duplicate ucid guard),
    // leaving the chart without their datasets.
    const overlaySelections = this._selections.filter(s => s.chartType === CHART_TYPES.OVERLAY);
    overlaySelections.forEach(selection => {
      this.displayOnOverlay(selection);
    });
  }

  /**
   * Process indicator data and prepare selection datasets.
   * This is separated from display so consumers can control DOM creation.
   */
  processSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    data: IndicatorDataRow[]
  ): void {
    selection.results.forEach((result: IndicatorResult) => {
      const resultConfig = listing.results.find(
        (x: IndicatorResultConfig) => x.dataName === result.dataName
      );
      if (!resultConfig) return;

      const dataset = baseDataset(result, resultConfig);

      // Candle series carry `{ x, o, h, l, c }` points read from the row's
      // OHLC fields rather than a single `dataName` value, and take their
      // up/down coloring from the themed candlestick element defaults — the
      // per-point color machinery below does not apply.
      if (result.lineType === "candle") {
        const candlePoints = buildFinancialDataPoints(data, result);
        addExtraFinancialBars(candlePoints, this.extraBars);
        dataset.data = candlePoints;
        result.dataset = dataset;
        return;
      }

      const { dataPoints, pointColor, pointRotation, hasConditionalColor } = buildDataPoints(
        data,
        result,
        listing
      );
      addExtraBars(dataPoints, this.extraBars);

      // Per-point coloring: candlestick-pattern markers and expanding/contracting
      // histograms (e.g. Gator) vary color per row. Bars apply it via
      // `backgroundColor`; point/line series via the point color arrays.
      if (hasConditionalColor) {
        const ext = dataset as ExtendedChartDataset;
        if (dataset.type === "bar") {
          ext.backgroundColor = pointColor;
        } else {
          ext.pointRotation = pointRotation;
          ext.pointBackgroundColor = pointColor;
          ext.pointBorderColor = pointColor;
        }
      }

      dataset.data = dataPoints;
      result.dataset = dataset;
    });

    // Store deep copy for efficient resizing.
    // structuredClone is used instead of JSON.parse/stringify to safely preserve
    // NaN values and avoid crashes on undefined fields.
    this._allProcessedDatasets.set(
      selection.ucid,
      selection.results.map(result => structuredClone(result.dataset))
    );
  }

  /**
   * Display a processed selection on the appropriate chart.
   *
   * @throws {Error} if `selection.ucid` collides with the reserved internal key
   *   used by the overlay's candlestick+volume cache entry.
   */
  displaySelection(selection: IndicatorSelection, listing: IndicatorListing): void {
    if (selection.ucid === OVERLAY_MAIN_KEY) {
      throw new Error(
        `displaySelection: ucid "${OVERLAY_MAIN_KEY}" is reserved for internal use; ` +
          `pick a different ucid for this selection.`
      );
    }
    if (this._selections.some(s => s.ucid === selection.ucid)) return;
    this._selections.push(selection);

    if (listing.chartType === CHART_TYPES.OVERLAY) {
      this.displayOnOverlay(selection);
    }
    // Oscillator charts require consumer to provide the canvas context
    // via createOscillator() after calling processSelectionData()
  }

  /**
   * Display indicator on the overlay chart.
   * Slices datasets to the current window before adding so overlay indicators
   * are aligned with the windowed x-axis from the start.
   */
  private displayOnOverlay(selection: IndicatorSelection): void {
    if (!this._overlayChart) return;

    this.sliceOverlaySelection(selection);

    this._overlayChart.addIndicatorDatasets(selection.results);
    this._overlayChart.updateLegends(this._selections);
    this.syncPriceCandleVisibility();
  }

  /**
   * Hide the raw price candles while any candle-rendered overlay (e.g.
   * Heikin-Ashi) is displayed, and restore them when the last one is removed.
   * The transform *replaces* the price bars — both series sit at nearly the
   * same prices, so drawing them together occludes each other. Volume is
   * unaffected. Runs after every overlay add/remove, including the re-attach
   * pass in `initializeOverlay`, so the state survives overlay re-creation.
   */
  private syncPriceCandleVisibility(): void {
    if (!this._overlayChart) return;
    const hasCandleOverlay = this._selections.some(
      s => s.chartType === CHART_TYPES.OVERLAY && s.results.some(r => r.lineType === "candle")
    );
    this._overlayChart.setPriceVisibility(!hasCandleOverlay);
  }

  /**
   * Create an oscillator chart for a selection.
   * Consumer must provide the canvas context and call this after processSelectionData()
   * AND after displaySelection() so the selection is registered in this.selections.
   *
   * Renders with the full (unsliced) result.dataset.data so OscillatorChart's
   * fullThresholdDatasets capture complete history for later re-slicing. Then,
   * when an overlay has been initialized with a smaller window, applies the
   * same slice immediately so the new oscillator's x-axis coincides with the
   * windowed overlay from the first paint. Without this, oscillators created
   * after `initializeOverlay` (or after a window resize race) would render
   * spanning the full quote history while the overlay shows only the last
   * `currentBarCount` candles — visibly misaligned at mobile breakpoints.
   *
   * @throws {Error} if displaySelection() has not been called for this selection,
   *   because setBarCount() iterates this.selections and will silently skip any
   *   oscillator whose ucid is not present there.
   * @throws {Error} if processSelectionData() has not been called — the dataset
   *   cache must be populated so the windowed slice has data to render. Validated
   *   in every viewport state so failures are not viewport-dependent.
   */
  createOscillator(
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): OscillatorChart {
    // Guard: selection must be registered via displaySelection() first, otherwise
    // setBarCount() (which iterates this._selections) will never update this oscillator.
    if (!this._selections.some(s => s.ucid === selection.ucid)) {
      throw new Error(
        `createOscillator: selection "${selection.ucid}" has not been registered. ` +
          `Call displaySelection() before createOscillator() to ensure setBarCount() ` +
          `can update this oscillator when the window changes.`
      );
    }

    // Guard: processSelectionData() must have populated the dataset cache.
    // Validated unconditionally (not only under a windowed overlay) so the
    // failure mode doesn't depend on viewport state — otherwise the same
    // missing-precondition bug would throw on mobile and silently render a
    // broken chart on desktop.
    const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
    if (!fullDatasets) {
      throw new Error(
        `createOscillator: selection "${selection.ucid}" has no processed datasets. ` +
          `Call processSelectionData() before createOscillator() so the oscillator ` +
          `has data to render.`
      );
    }

    this._oscillators.get(selection.ucid)?.destroy();
    const oscillator = new OscillatorChart(ctx, this._settings);
    oscillator.render(selection, listing);
    this._oscillators.set(selection.ucid, oscillator);

    // Align the freshly rendered oscillator with the current viewport window.
    // render() captures full-history threshold datasets internally; this slice
    // only narrows what's drawn, leaving the cached full datasets intact for
    // future setBarCount() calls.
    const totalQuotes = this._allQuotes.length;
    if (totalQuotes > 0 && this._currentBarCount < totalQuotes) {
      oscillator.applySlicedData(
        selection,
        fullDatasets as IndicatorDataset[],
        this.sliceStart,
        this.sliceEnd
      );
    }

    return oscillator;
  }

  /**
   * Set the order of the registered selections. Listed ucids come first, in the
   * order given; unknown ucids are ignored and unlisted selections follow in
   * their existing order. For overlay selections the order is the layering
   * (earlier draws over later, among results with the same `order`; bands carry a higher
   * `order` than lines and stay behind them). The caller orders oscillator canvases itself.
   */
  reorderSelections(ucids: readonly string[]): void {
    const byUcid = new Map(this._selections.map(selection => [selection.ucid, selection]));
    const listed = ucids.flatMap(ucid => {
      const selection = byUcid.get(ucid);
      byUcid.delete(ucid);
      return selection ? [selection] : [];
    });
    this._selections.splice(0, this._selections.length, ...listed, ...byUcid.values());

    if (!this._overlayChart) return;
    const overlayResults = this._selections
      .filter(selection => selection.chartType === CHART_TYPES.OVERLAY)
      .flatMap(selection => selection.results);
    this._overlayChart.reorderIndicatorDatasets(overlayResults);
    this._overlayChart.updateLegends(this._selections);
  }

  /**
   * Remove an indicator selection and its chart.
   */
  removeSelection(ucid: string): void {
    // Use findIndex for a single O(n) pass instead of find + indexOf.
    const sx = this._selections.findIndex(x => x.ucid === ucid);
    if (sx === -1) return;

    const [selection] = this._selections.splice(sx, 1);
    this._allProcessedDatasets.delete(ucid);

    if (selection.chartType === CHART_TYPES.OVERLAY) {
      if (this._overlayChart) {
        this._overlayChart.removeIndicatorDatasets(selection.results);
        this._overlayChart.updateLegends(this._selections);
        this.syncPriceCandleVisibility();
        this._overlayChart.chart?.update();
      }
    } else {
      const oscillator = this._oscillators.get(ucid);
      if (oscillator) {
        oscillator.destroy();
        this._oscillators.delete(ucid);
      }
    }
  }

  /**
   * Update theme across all charts.
   */
  updateTheme(settings: ChartSettings): void {
    this._settings = { ...settings };

    if (this._overlayChart) {
      this._overlayChart.updateTheme(settings);
      this._overlayChart.updateLegends(this._selections);
      this._overlayChart.chart?.update("none");
    }

    this._oscillators.forEach((oscillator, ucid) => {
      oscillator.updateTheme(settings);
      const selection = this._selections.find(s => s.ucid === ucid);
      if (selection) {
        oscillator.updateLegend(selection);
      }
      oscillator.chart?.update("none");
    });
  }

  /**
   * Update all charts with a new bar count (for window resize). The window
   * stays anchored to the newest bar, so any pan offset is cleared.
   */
  setBarCount(barCount: number): void {
    // No quotes -> nothing to do.
    if (this._allQuotes.length === 0) return;

    this.applyWindow(this.normalizeBarCount(barCount), 0);
  }

  /**
   * Show `count` bars starting at history index `start`. `count` is clamped to
   * [20, history length] and `start` to [0, length - count].
   */
  setWindow(start: number, count: number): void {
    if (this._allQuotes.length === 0) return;

    this.setClamped(clampWindow(start, count, this._allQuotes.length));
  }

  /**
   * Shift the window by a signed number of bars, stopping at the history ends.
   * Negative moves toward older bars, positive toward the newest.
   */
  panBy(bars: number): void {
    if (this._allQuotes.length === 0) return;

    this.setClamped(panWindow(this.currentWindow, bars, this._allQuotes.length));
  }

  /**
   * Scale the visible bar count by `factor` (>1 zooms out, <1 zooms in) while
   * the bar at `anchor` (0..1 across the window, default 0.5) stays put.
   */
  zoomBy(factor: number, anchor = 0.5): void {
    if (this._allQuotes.length === 0) return;

    this.setClamped(zoomWindow(this.currentWindow, factor, anchor, this._allQuotes.length));
  }

  private get currentWindow(): BarWindow {
    return { start: this.sliceStart, count: this._currentBarCount };
  }

  /** History index of the first visible bar. */
  private get sliceStart(): number {
    return Math.max(0, this._allQuotes.length - this._currentBarCount - this._windowOffset);
  }

  /**
   * Exclusive end index of the plotted points: the visible bars plus `extraBars`
   * trailing slots, so a pan never changes how many points share the x axis and
   * the bar width stays put. Anchored to the newest bar the slots are the padding
   * after it (`undefined` reads to the end of the dataset).
   */
  private get sliceEnd(): number | undefined {
    if (this._windowOffset === 0) return undefined;
    return Math.min(
      this.sliceStart + this._currentBarCount + this.extraBars,
      this._allQuotes.length + this.extraBars
    );
  }

  private setClamped(window: BarWindow): void {
    this.applyWindow(window.count, this._allQuotes.length - window.start - window.count);
  }

  /** The one slicing path: store the window, then re-slice every pane to it. */
  private applyWindow(barCount: number, offset: number): void {
    if (barCount === this._currentBarCount && offset === this._windowOffset) return;
    this._currentBarCount = barCount;
    this._windowOffset = offset;

    const startIndex = this.sliceStart;
    const endIndex = this.sliceEnd;

    // Update overlay main datasets (candlestick + volume)
    const fullMainDatasets = this._allProcessedDatasets.get(OVERLAY_MAIN_KEY);
    if (this._overlayChart && fullMainDatasets) {
      this._overlayChart.applySlicedData(fullMainDatasets, startIndex, endIndex);
    }

    // Overlay indicator datasets stay aligned with the windowed x-axis.
    let overlayIndicatorsUpdated = false;
    this._selections.forEach(selection => {
      if (selection.chartType !== CHART_TYPES.OVERLAY) return;
      if (this.sliceOverlaySelection(selection)) overlayIndicatorsUpdated = true;
    });

    // Trigger a single chart refresh after all overlay indicator data has been sliced.
    if (overlayIndicatorsUpdated && this._overlayChart) {
      this._overlayChart.chart?.update("none");
    }

    // The legend anchors to the y-axis max, which indicator data can move.
    this._overlayChart?.updateLegends(this._selections);

    // Update oscillators
    this._selections.forEach(selection => {
      if (selection.chartType !== CHART_TYPES.OSCILLATOR) return;

      const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
      const oscillator = this._oscillators.get(selection.ucid);
      if (!fullDatasets || !oscillator) return;

      // Cached datasets for an oscillator selection are always indicator datasets
      // (the heterogeneous cache also holds candlestick+volume under OVERLAY_MAIN_KEY).
      oscillator.applySlicedData(
        selection,
        fullDatasets as IndicatorDataset[],
        startIndex,
        endIndex
      );
    });
  }

  /**
   * Slice an overlay selection's datasets, and their per-bar style arrays
   * (pointBackgroundColor, pointBorderColor, pointRotation, bar
   * backgroundColor), from the cached full history to the current window.
   * Returns false when no cached datasets exist for the selection.
   */
  private sliceOverlaySelection(selection: IndicatorSelection): boolean {
    const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
    if (!fullDatasets) return false;

    const startIndex = this.sliceStart;
    const endIndex = this.sliceEnd;

    selection.results.forEach((result, i) => {
      const full = fullDatasets[i] as ExtendedChartDataset;
      if (full && result.dataset) {
        result.dataset.data = [...full.data.slice(startIndex, endIndex)];
        const ext = result.dataset as ExtendedChartDataset;
        // Chart.js permits Scriptable / scalar forms for these fields on
        // its base type, so guard at runtime before slicing — the
        // `as number[]` / `as string[]` casts only quiet the compiler.
        if (Array.isArray(full.pointBackgroundColor)) {
          ext.pointBackgroundColor = [
            ...(full.pointBackgroundColor as string[]).slice(startIndex, endIndex)
          ];
        }
        if (Array.isArray(full.pointBorderColor)) {
          ext.pointBorderColor = [
            ...(full.pointBorderColor as string[]).slice(startIndex, endIndex)
          ];
        }
        if (Array.isArray(full.pointRotation)) {
          ext.pointRotation = [...(full.pointRotation as number[]).slice(startIndex, endIndex)];
        }
        // Bar histograms (e.g. expanding/contracting series) carry a per-bar
        // backgroundColor array; slice it alongside the data so colors stay
        // aligned with the visible window.
        if (Array.isArray(full.backgroundColor)) {
          ext.backgroundColor = [...(full.backgroundColor as string[]).slice(startIndex, endIndex)];
        }
      }
    });
    return true;
  }

  /**
   * Force all charts to resize.
   * Defers one animation frame so CSS layout has settled before Chart.js reads
   * container dimensions, avoiding race conditions on immediate resize calls.
   */
  resize(): void {
    requestAnimationFrame(() => {
      this._overlayChart?.resize();
      this._oscillators.forEach(oscillator => oscillator.resize());
    });
  }

  /**
   * Destroy all charts and clean up.
   */
  destroy(): void {
    this._overlayChart?.destroy();
    this._overlayChart = undefined;

    this._oscillators.forEach(oscillator => oscillator.destroy());
    this._oscillators.clear();

    this._selections = [];
    this._allProcessedDatasets.clear();
    this._allQuotes = [];
    this._windowOffset = 0;
  }

  private normalizeBarCount(barCount: number): number {
    if (this._allQuotes.length === 0) return 1;

    const normalized = Number.isFinite(barCount) ? Math.floor(barCount) : 1;
    return Math.max(1, Math.min(normalized, this._allQuotes.length));
  }
}
