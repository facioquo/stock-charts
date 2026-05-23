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
  type Quote
} from "../config/types";

import { baseDataset } from "../config/datasets";
import { buildDataPoints, addExtraBars } from "../data/transformers";
import { OverlayChart } from "./overlay-chart";
import { OscillatorChart } from "./oscillator-chart";

const EXTRA_BARS = 6;

const CHART_TYPES = {
  OVERLAY: "overlay",
  OSCILLATOR: "oscillator"
} as const;

const CATEGORIES = {
  CANDLESTICK_PATTERN: "candlestick-pattern"
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
  private _allQuotes: Quote[] = [];
  private _allProcessedDatasets = new Map<string, ChartDataset[]>();
  private _currentBarCount = 250;
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
  get allQuotes(): ReadonlyArray<Quote> {
    return this._allQuotes;
  }

  /** Current number of bars being displayed. */
  get currentBarCount(): number {
    return this._currentBarCount;
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
    allQuotes: Quote[],
    barCount: number
  ): void {
    this._allQuotes = allQuotes;
    this._currentBarCount = this.normalizeBarCount(barCount);

    this._overlayChart?.destroy();
    this._overlayChart = new OverlayChart(ctx, this._settings);

    // Slice quotes to barCount so the chart is initialized with the visible
    // data range only. This gives Chart.js correct y-axis bounds from the
    // start, matching production behavior where charts always receive
    // pre-sliced data. Rendering with all historical quotes first causes
    // the y-axis to lock to the full price range (~$540–$950) even after
    // a subsequent applySlicedData() + chart.update() call.
    const startIndex = Math.max(0, allQuotes.length - this._currentBarCount);
    const slicedQuotes = allQuotes.slice(startIndex);
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
      const { dataPoints, pointColor, pointRotation } = buildDataPoints(data, result, listing);
      addExtraBars(dataPoints, this.extraBars);

      if (listing.category === CATEGORIES.CANDLESTICK_PATTERN && dataset.type !== "bar") {
        const ext = dataset as ExtendedChartDataset;
        ext.pointRotation = pointRotation;
        ext.pointBackgroundColor = pointColor;
        ext.pointBorderColor = pointColor;
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
   * Slices datasets to currentBarCount before adding so overlay indicators
   * are aligned with the windowed x-axis from the start.
   */
  private displayOnOverlay(selection: IndicatorSelection): void {
    if (!this._overlayChart) return;

    // Slice indicator datasets to currentBarCount before adding to the windowed chart.
    // Also slice style arrays (pointBackgroundColor, pointBorderColor, pointRotation)
    // to keep them synchronized with the data length.
    const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
    if (fullDatasets) {
      const startIndex = Math.max(0, this._allQuotes.length - this._currentBarCount);
      selection.results.forEach((result, i) => {
        const full = fullDatasets[i] as ExtendedChartDataset;
        if (full && result.dataset) {
          result.dataset.data = [...full.data.slice(startIndex)];
          const ext = result.dataset as ExtendedChartDataset;
          // Chart.js permits Scriptable / scalar forms for these fields on
          // its base type, so guard at runtime before slicing — the
          // `as number[]` / `as string[]` casts only quiet the compiler.
          if (Array.isArray(full.pointBackgroundColor)) {
            ext.pointBackgroundColor = [
              ...(full.pointBackgroundColor as string[]).slice(startIndex)
            ];
          }
          if (Array.isArray(full.pointBorderColor)) {
            ext.pointBorderColor = [...(full.pointBorderColor as string[]).slice(startIndex)];
          }
          if (Array.isArray(full.pointRotation)) {
            ext.pointRotation = [...(full.pointRotation as number[]).slice(startIndex)];
          }
        }
      });
    }

    this._overlayChart.addIndicatorDatasets(selection.results);
    this._overlayChart.updateLegends(this._selections);
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
      const startIndex = totalQuotes - this._currentBarCount;
      oscillator.applySlicedData(selection, fullDatasets as IndicatorDataset[], startIndex);
    }

    return oscillator;
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
   * Update all charts with a new bar count (for window resize).
   */
  setBarCount(barCount: number): void {
    // No quotes -> nothing to do.
    if (this._allQuotes.length === 0) return;

    const totalQuotes = this._allQuotes.length;
    const normalizedBarCount = this.normalizeBarCount(barCount);

    if (normalizedBarCount === this._currentBarCount) return;
    this._currentBarCount = normalizedBarCount;

    const startIndex = Math.max(0, totalQuotes - normalizedBarCount);

    // Update overlay main datasets (candlestick + volume)
    const fullMainDatasets = this._allProcessedDatasets.get(OVERLAY_MAIN_KEY);
    if (this._overlayChart && fullMainDatasets) {
      this._overlayChart.applySlicedData(fullMainDatasets, startIndex);
      this._overlayChart.updateLegends(this._selections);
    }

    // Update overlay indicator datasets to stay aligned with the windowed x-axis.
    // Mirror the oscillator loop below but for OVERLAY selections: retrieve each
    // indicator's full dataset from allProcessedDatasets and slice to startIndex.
    // Also slice style arrays (pointBackgroundColor, pointBorderColor, pointRotation)
    // to keep them synchronized with the data length.
    let overlayIndicatorsUpdated = false;
    this._selections.forEach(selection => {
      if (selection.chartType !== CHART_TYPES.OVERLAY) return;

      const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
      if (!fullDatasets) return;

      selection.results.forEach((result, i) => {
        const full = fullDatasets[i] as ExtendedChartDataset;
        if (full && result.dataset) {
          result.dataset.data = [...full.data.slice(startIndex)];
          const ext = result.dataset as ExtendedChartDataset;
          if (Array.isArray(full.pointBackgroundColor)) {
            ext.pointBackgroundColor = [
              ...(full.pointBackgroundColor as string[]).slice(startIndex)
            ];
          }
          if (Array.isArray(full.pointBorderColor)) {
            ext.pointBorderColor = [...(full.pointBorderColor as string[]).slice(startIndex)];
          }
          if (Array.isArray(full.pointRotation)) {
            ext.pointRotation = [...(full.pointRotation as number[]).slice(startIndex)];
          }
        }
      });
      overlayIndicatorsUpdated = true;
    });

    // Trigger a single chart refresh after all overlay indicator data has been sliced.
    if (overlayIndicatorsUpdated && this._overlayChart) {
      this._overlayChart.chart?.update("none");
    }

    // Update oscillators
    this._selections.forEach(selection => {
      if (selection.chartType !== CHART_TYPES.OSCILLATOR) return;

      const fullDatasets = this._allProcessedDatasets.get(selection.ucid);
      const oscillator = this._oscillators.get(selection.ucid);
      if (!fullDatasets || !oscillator) return;

      // Cached datasets for an oscillator selection are always indicator datasets
      // (the heterogeneous cache also holds candlestick+volume under OVERLAY_MAIN_KEY).
      oscillator.applySlicedData(selection, fullDatasets as IndicatorDataset[], startIndex);
    });
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
  }

  private normalizeBarCount(barCount: number): number {
    if (this._allQuotes.length === 0) return 1;

    const normalized = Number.isFinite(barCount) ? Math.floor(barCount) : 1;
    return Math.max(1, Math.min(normalized, this._allQuotes.length));
  }
}
