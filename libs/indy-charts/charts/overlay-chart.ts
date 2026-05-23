import { Chart, type ChartData, type ChartDataset } from "chart.js";

import { type ScaleValue } from "chartjs-plugin-annotation";

import {
  applyFinancialElementTheme,
  buildCandlestickDataset,
  buildFinancialChartOptions,
  buildVolumeDataset,
  getFinancialPalette
} from "@facioquo/chartjs-chart-financial";

import { processQuoteData } from "../data/transformers";
import { baseOverlayConfig, baseOverlayOptions } from "../config/overlay";
import { commonLegendAnnotation } from "../config/annotations";
import {
  type ChartSettings,
  type IndicatorResult,
  type IndicatorSelection,
  type Quote
} from "../config/types";

const CHART_TYPES = {
  OVERLAY: "overlay"
} as const;

export class OverlayChart {
  /**
   * Underlying Chart.js instance. Read access (theme tweaks, dataset
   * inspection) is supported. **Do not call `chart.destroy()` directly** — use
   * {@link OverlayChart.destroy} so library-level state (legend selections,
   * volume-axis cache) is released alongside the Chart.js teardown.
   */
  chart: Chart | undefined;
  private volumeAxisSize = 0;
  private _latestLegendSelections: IndicatorSelection[] = [];

  constructor(
    private readonly ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    private settings: ChartSettings
  ) {}

  /**
   * Initialize the overlay chart with quote data.
   * Returns the full-resolution datasets for use in dynamic slicing.
   */
  render(quotes: Quote[], extraBars: number = 6): ChartDataset[] {
    const palette = getFinancialPalette(this.settings.isDarkTheme ? "dark" : "light");
    applyFinancialElementTheme(palette);

    const { priceData, volumeAxisSize } = processQuoteData(quotes);
    this.volumeAxisSize = volumeAxisSize;

    const chartData: ChartData = {
      datasets: [
        buildCandlestickDataset(priceData, palette.candleBorder),
        buildVolumeDataset(quotes, extraBars, palette)
      ]
    };

    const chartConfig = baseOverlayConfig(volumeAxisSize, this.settings);
    chartConfig.options = buildFinancialChartOptions(chartConfig.options ?? {});
    chartConfig.data = chartData;

    // Re-anchor annotations after Chart.js ResizeObserver has committed the
    // OHLC-derived scale bounds. queueMicrotask defers until after the
    // synchronous chart.update('resize') call completes, avoiding re-entrancy.
    if (chartConfig.options) {
      chartConfig.options.onResize = () => {
        if (this._latestLegendSelections.length > 0) {
          queueMicrotask(() => {
            this._applyLegendAnnotations();
          });
        }
      };
    }

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.ctx, chartConfig);

    // Return deep copy of datasets for dynamic slicing (structuredClone preserves NaN)
    return structuredClone(chartData.datasets);
  }

  /**
   * Build full-history datasets without creating a chart.
   * Use when the chart was initialized with a sliced view but the full
   * dataset is needed so setBarCount() can re-slice across the entire history.
   */
  buildFullDatasets(allQuotes: Quote[], extraBars: number = 6): ChartDataset[] {
    const palette = getFinancialPalette(this.settings.isDarkTheme ? "dark" : "light");
    const { priceData } = processQuoteData(allQuotes);
    const datasets: ChartDataset[] = [
      buildCandlestickDataset(priceData, palette.candleBorder),
      buildVolumeDataset(allQuotes, extraBars, palette)
    ];
    return structuredClone(datasets);
  }

  addIndicatorDatasets(results: IndicatorResult[]): void {
    if (!this.chart) return;
    const chart = this.chart;
    results.forEach((r: IndicatorResult) => {
      chart.data.datasets.push(r.dataset);
    });
    this.chart.update("none");
  }

  removeIndicatorDatasets(results: IndicatorResult[]): void {
    if (!this.chart) return;
    const chart = this.chart;
    results.forEach((result: IndicatorResult) => {
      const dx = chart.data.datasets.indexOf(result.dataset, 0);
      if (dx !== -1) {
        chart.data.datasets.splice(dx, 1);
      }
    });
    this.chart.update("none");
  }

  updateLegends(overlaySelections: IndicatorSelection[]): void {
    if (!this.chart) return;
    if (!this.chart.scales["x"] || !this.chart.scales["y"]) return;

    this._latestLegendSelections = overlaySelections;
    this._applyLegendAnnotations();
  }

  private _applyLegendAnnotations(): void {
    if (!this.chart) return;
    if (!this.chart.scales["x"] || !this.chart.scales["y"]) return;

    const xPos: ScaleValue = this.chart.scales["x"].min;
    const yPos: ScaleValue = this.chart.scales["y"].max;
    let adjY = 10;

    const sorted = [...this._latestLegendSelections]
      .filter(x => x.chartType === CHART_TYPES.OVERLAY)
      .sort((a, b) => a.label.localeCompare(b.label));

    if (this.chart.options?.plugins?.annotation) {
      this.chart.options.plugins.annotation.annotations = sorted
        .filter(selection => selection.results.length > 0 && selection.results[0] !== undefined)
        .map((selection: IndicatorSelection, index: number) => {
          const annotation = commonLegendAnnotation(
            selection.label,
            xPos,
            yPos,
            adjY,
            this.settings
          );
          annotation.id = "legend" + (index + 1).toString();
          annotation.color = selection.results[0].color;
          adjY += 15; // LEGEND_Y_OFFSET
          return annotation;
        });
      this.chart.update("none");
    }
  }

  updateTheme(settings: ChartSettings): void {
    this.settings = settings;
    if (!this.chart) return;

    applyFinancialElementTheme(getFinancialPalette(settings.isDarkTheme ? "dark" : "light"));

    this.chart.options = buildFinancialChartOptions(
      baseOverlayOptions(this.volumeAxisSize, settings)
    );
    this.chart.update("none");
  }

  /**
   * Apply sliced datasets from pre-computed full datasets.
   */
  applySlicedData(fullMainDatasets: ChartDataset[], startIndex: number): void {
    if (!this.chart) return;

    // Price dataset (candlestick - index 0)
    const fullPrice = fullMainDatasets[0];
    const currentPrice = this.chart.data.datasets[0];
    if (fullPrice && currentPrice && fullPrice.type === "candlestick") {
      currentPrice.data = [...fullPrice.data.slice(startIndex)];
    }

    // Volume dataset (bar - index 1)
    const fullVolume = fullMainDatasets[1];
    const currentVolume = this.chart.data.datasets[1];
    if (fullVolume && currentVolume && fullVolume.type === "bar") {
      currentVolume.data = [...fullVolume.data.slice(startIndex)];
      if (fullVolume.backgroundColor && Array.isArray(fullVolume.backgroundColor)) {
        currentVolume.backgroundColor = [
          ...(fullVolume.backgroundColor as string[]).slice(startIndex)
        ];
      }
    }

    // Match OscillatorChart.applySlicedData which also uses "none" — both charts
    // share the same setBarCount() trigger, so they must update with identical
    // semantics to avoid one snapping while the other transitions.
    this.chart.update("none");
  }

  resize(): void {
    if (!this.chart) return;
    this.chart.resize();
    this.chart.update("resize");
  }

  /**
   * Tear down this OverlayChart and its underlying Chart.js instance. Releases
   * the cached legend selections, the volume-axis cache, and the Chart.js
   * canvas binding. Always call this from your component's unmount hook — not
   * `chart.destroy()`, which leaves library-level state orphaned.
   */
  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
    this._latestLegendSelections = [];
    this.volumeAxisSize = 0;
  }
}
