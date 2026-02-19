import { ChartDataset } from "chart.js";

import {
  ChartSettings,
  IndicatorListing,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Quote
} from "../config/types";

import { baseDataset } from "../config/datasets";
import { buildDataPoints, addExtraBars } from "../data/transformers";
import { OverlayChart } from "./overlay-chart";
import { OscillatorChart } from "./oscillator-chart";

const EXTRA_BARS = 7;

const CHART_TYPES = {
  OVERLAY: "overlay",
  OSCILLATOR: "oscillator"
} as const;

const CATEGORIES = {
  CANDLESTICK_PATTERN: "candlestick-pattern"
} as const;

// Extended dataset interface for candlestick pattern datasets
type ExtendedChartDataset = ChartDataset & {
  pointRotation?: number[];
  pointBackgroundColor?: string[];
  pointBorderColor?: string[];
};

export interface ChartManagerConfig {
  settings: ChartSettings;
  extraBars?: number;
}

export class ChartManager {
  overlayChart: OverlayChart | undefined;
  oscillators = new Map<string, OscillatorChart>();
  selections: IndicatorSelection[] = [];
  allQuotes: Quote[] = [];
  allProcessedDatasets = new Map<string, ChartDataset[]>();
  currentBarCount = 250;
  settings: ChartSettings;
  private extraBars: number;

  constructor(config: ChartManagerConfig) {
    this.settings = config.settings;
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
    this.allQuotes = allQuotes;
    this.currentBarCount = barCount;

    this.overlayChart = new OverlayChart(ctx, this.settings);

    // Render with full allQuotes so stored datasets cover complete history,
    // enabling correct slicing when setBarCount() is called later.
    const fullDatasets = this.overlayChart.render(allQuotes, this.extraBars);
    this.allProcessedDatasets.set("overlay-main", fullDatasets);

    // Apply initial barCount slice for display.
    const startIndex = Math.max(0, allQuotes.length - barCount);
    this.overlayChart.applySlicedData(fullDatasets, startIndex);
  }

  /**
   * Process indicator data and prepare selection datasets.
   * This is separated from display so consumers can control DOM creation.
   */
  processSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    data: import("../config/types").IndicatorDataRow[]
  ): void {
    selection.results.forEach((result: IndicatorResult) => {
      const resultConfig = listing.results.find(
        (x: IndicatorResultConfig) => x.dataName === result.dataName
      );
      if (!resultConfig) return;

      const dataset = baseDataset(result, resultConfig);
      const { dataPoints, pointColor, pointRotation } = buildDataPoints(data, result, listing);
      addExtraBars(dataPoints, this.extraBars);

      if (
        listing.category === CATEGORIES.CANDLESTICK_PATTERN &&
        dataset &&
        dataset.type !== "bar"
      ) {
        const ext = dataset as ExtendedChartDataset;
        ext.pointRotation = pointRotation;
        ext.pointBackgroundColor = pointColor;
        ext.pointBorderColor = pointColor;
      }

      if (dataset) {
        dataset.data = dataPoints;
        result.dataset = dataset as ChartDataset;
      }
    });

    // Store deep copy for efficient resizing
    this.allProcessedDatasets.set(
      selection.ucid,
      selection.results.map(result => JSON.parse(JSON.stringify(result.dataset)))
    );
  }

  /**
   * Display a processed selection on the appropriate chart.
   */
  displaySelection(selection: IndicatorSelection, listing: IndicatorListing): void {
    this.selections.push(selection);

    if (listing.chartType === CHART_TYPES.OVERLAY) {
      this.displayOnOverlay(selection);
    }
    // Oscillator charts require consumer to provide the canvas context
    // via createOscillator() after calling processSelectionData()
  }

  /**
   * Display indicator on the overlay chart.
   */
  private displayOnOverlay(selection: IndicatorSelection): void {
    if (!this.overlayChart) return;
    this.overlayChart.addIndicatorDatasets(selection.results);
    this.overlayChart.updateLegends(this.selections);
  }

  /**
   * Create an oscillator chart for a selection.
   * Consumer must provide the canvas context and call this after processSelectionData().
   */
  createOscillator(
    ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): OscillatorChart {
    const oscillator = new OscillatorChart(ctx, this.settings);
    oscillator.render(selection, listing);
    this.oscillators.set(selection.ucid, oscillator);
    return oscillator;
  }

  /**
   * Remove an indicator selection and its chart.
   */
  removeSelection(ucid: string): void {
    const selection = this.selections.find(x => x.ucid === ucid);
    if (!selection) return;

    const sx = this.selections.indexOf(selection, 0);
    if (sx !== -1) {
      this.selections.splice(sx, 1);
    }

    this.allProcessedDatasets.delete(ucid);

    if (selection.chartType === CHART_TYPES.OVERLAY) {
      if (this.overlayChart) {
        this.overlayChart.removeIndicatorDatasets(selection.results);
        this.overlayChart.updateLegends(this.selections);
        this.overlayChart.chart?.update();
      }
    } else {
      const oscillator = this.oscillators.get(ucid);
      if (oscillator) {
        oscillator.destroy();
        this.oscillators.delete(ucid);
      }
    }
  }

  /**
   * Update theme across all charts.
   */
  updateTheme(settings: ChartSettings): void {
    this.settings = settings;

    if (this.overlayChart) {
      this.overlayChart.updateTheme(settings);
      this.overlayChart.updateLegends(this.selections);
      this.overlayChart.chart?.update("none");
    }

    this.oscillators.forEach((oscillator, ucid) => {
      oscillator.updateTheme(settings);
      const selection = this.selections.find(s => s.ucid === ucid);
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
    if (barCount === this.currentBarCount || this.allQuotes.length === 0) return;
    this.currentBarCount = barCount;

    const totalQuotes = this.allQuotes.length;
    const startIndex = Math.max(0, totalQuotes - barCount);

    // Update overlay
    const fullMainDatasets = this.allProcessedDatasets.get("overlay-main");
    if (this.overlayChart && fullMainDatasets) {
      this.overlayChart.applySlicedData(fullMainDatasets, startIndex);
      this.overlayChart.updateLegends(this.selections);
    }

    // Update oscillators
    this.selections.forEach(selection => {
      if (selection.chartType !== CHART_TYPES.OSCILLATOR) return;

      const fullDatasets = this.allProcessedDatasets.get(selection.ucid);
      const oscillator = this.oscillators.get(selection.ucid);
      if (!fullDatasets || !oscillator) return;

      oscillator.applySlicedData(selection, fullDatasets, startIndex);
    });
  }

  /**
   * Force all charts to resize.
   */
  resize(): void {
    this.overlayChart?.resize();
    this.oscillators.forEach(oscillator => oscillator.resize());
  }

  /**
   * Destroy all charts and clean up.
   */
  destroy(): void {
    this.overlayChart?.destroy();
    this.overlayChart = undefined;

    this.oscillators.forEach(oscillator => oscillator.destroy());
    this.oscillators.clear();

    this.selections = [];
    this.allProcessedDatasets.clear();
    this.allQuotes = [];
  }
}
