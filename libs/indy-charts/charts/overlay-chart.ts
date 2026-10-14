import { Chart, type ChartData, type ChartDataset, type ScatterDataPoint } from "chart.js";

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
import { commonLegendAnnotation, legendSwatchAnnotation } from "../config/annotations";
import { FONT_FAMILY } from "../config/common";
import { LEGEND_ROW_HEIGHT, LEGEND_SWATCH_WIDTH, layoutLegend } from "../config/legend";
import {
  type ChartSettings,
  type IndicatorResult,
  type IndicatorSelection,
  type Bar
} from "../config/types";

const CHART_TYPES = {
  OVERLAY: "overlay"
} as const;

export class OverlayChart {
  private _chart: Chart | undefined;
  private volumeAxisSize = 0;
  private _latestLegendSelections: IndicatorSelection[] = [];

  /**
   * Underlying Chart.js instance. Exposed read-only — assigning to this field
   * is a TypeScript error. Read access (theme tweaks, dataset inspection) is
   * supported. **Do not call `chart.destroy()` directly** — use
   * {@link OverlayChart.destroy} so library-level state (legend selections,
   * volume-axis cache) is released alongside the Chart.js teardown.
   */
  get chart(): Chart | undefined {
    return this._chart;
  }

  constructor(
    private readonly ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    private settings: ChartSettings
  ) {}

  /**
   * Initialize the overlay chart with quote data.
   * Returns the full-resolution datasets for use in dynamic slicing.
   */
  render(quotes: Bar[], extraBars: number = 6): ChartDataset[] {
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
    if (chartConfig.options) chartConfig.options.onResize = this._onResize;

    if (this._chart) this._chart.destroy();
    this._chart = new Chart(this.ctx, chartConfig);

    // Return deep copy of datasets for dynamic slicing (structuredClone preserves NaN)
    return structuredClone(chartData.datasets);
  }

  /**
   * Build full-history datasets without creating a chart.
   * Use when the chart was initialized with a sliced view but the full
   * dataset is needed so setBarCount() can re-slice across the entire history.
   */
  buildFullDatasets(allQuotes: Bar[], extraBars: number = 6): ChartDataset[] {
    const palette = getFinancialPalette(this.settings.isDarkTheme ? "dark" : "light");
    const { priceData } = processQuoteData(allQuotes);
    const datasets: ChartDataset[] = [
      buildCandlestickDataset(priceData, palette.candleBorder),
      buildVolumeDataset(allQuotes, extraBars, palette)
    ];
    return structuredClone(datasets);
  }

  addIndicatorDatasets(results: IndicatorResult[]): void {
    if (!this._chart) return;
    const chart = this._chart;
    results.forEach((r: IndicatorResult) => {
      chart.data.datasets.push(r.dataset);
    });
    this._chart.update("none");
  }

  removeIndicatorDatasets(results: IndicatorResult[]): void {
    if (!this._chart) return;
    const chart = this._chart;
    results.forEach((result: IndicatorResult) => {
      const dx = chart.data.datasets.indexOf(result.dataset, 0);
      if (dx !== -1) {
        chart.data.datasets.splice(dx, 1);
      }
    });
    this._chart.update("none");
  }

  /**
   * Re-stack the given indicator datasets in the order supplied, after the
   * price and volume datasets. Chart.js draws the lowest (`order`, index) last,
   * on top, so among datasets with the same `order` earlier ones draw over
   * later ones.
   */
  reorderIndicatorDatasets(results: IndicatorResult[]): void {
    if (!this._chart) return;
    const datasets = this._chart.data.datasets;
    const ordered = results.map(result => result.dataset);
    const rest = datasets.filter(dataset => !ordered.some(moved => moved === dataset));
    datasets.splice(0, datasets.length, ...rest, ...ordered);
    this._chart.update("none");
  }

  /**
   * Show or hide the main price candlestick dataset (index 0 — the same
   * invariant `applySlicedData` relies on). Used when a candle-rendered
   * overlay indicator (e.g. Heikin-Ashi) replaces the raw price candles:
   * the transform sits at nearly the same prices, so drawing both just
   * occludes the two series. Hidden datasets are excluded from y-scale
   * bounds and tooltips, so the replacement series drives both.
   */
  setPriceVisibility(visible: boolean): void {
    if (!this._chart) return;
    const price = this._chart.data.datasets[0];
    if (!price || price.type !== "candlestick") return;
    price.hidden = !visible;
    this._chart.update("none");
  }

  updateLegends(overlaySelections: IndicatorSelection[]): void {
    if (!this._chart) return;
    if (!this._chart.scales["x"] || !this._chart.scales["y"]) return;

    this._latestLegendSelections = overlaySelections;
    this._applyLegendAnnotations();
  }

  private readonly _onResize = (): void => {
    if (this._latestLegendSelections.length === 0) return;
    queueMicrotask(() => {
      this._applyLegendAnnotations();
    });
  };

  /**
   * Lay the legend out in a block above the plot: the block's height becomes
   * the chart's top padding, so entries never cover candles or lines. Each
   * entry is a series-coloured swatch plus a label in the theme text colour.
   */
  private _applyLegendAnnotations(): void {
    if (!this._chart) return;
    if (!this._chart.scales["x"] || !this._chart.scales["y"]) return;

    const xPos: ScaleValue = this._chart.scales["x"].min;
    const yPos: ScaleValue = this._chart.scales["y"].max;

    // Selection order, so the legend matches the order indicators were added in.
    const listed = this._latestLegendSelections
      .filter(x => x.chartType === CHART_TYPES.OVERLAY)
      .filter(selection => selection.results.length > 0 && selection.results[0] !== undefined);

    const { slots, height } = layoutLegend(
      listed.map(selection => selection.label),
      label => this._measureLegendText(label),
      this._legendWidth()
    );

    const options = this._chart.options;
    if (!options?.plugins?.annotation) return;

    const padding = (options.layout ??= {}).padding;
    options.layout.padding =
      typeof padding === "object" && padding !== null
        ? { ...padding, top: height }
        : { top: height, left: 1, bottom: 0, right: 1 };

    // Row centres sit above the plot top (yPos), inside the reserved padding.
    const rowCentre = (row: number): number =>
      row * LEGEND_ROW_HEIGHT + LEGEND_ROW_HEIGHT / 2 - height;

    options.plugins.annotation.annotations = listed.flatMap((selection, index) => {
      const slot = slots[index];
      if (!slot) return [];

      const label = commonLegendAnnotation(
        selection.label,
        xPos,
        yPos,
        rowCentre(slot.row),
        this.settings
      );
      label.id = "legend" + (index + 1).toString();
      label.xAdjust = slot.x + LEGEND_SWATCH_WIDTH;

      const swatch = legendSwatchAnnotation(
        selection.results[0].color,
        xPos,
        yPos,
        rowCentre(slot.row),
        slot.x,
        this.settings
      );
      swatch.id = label.id + "-swatch";

      return [swatch, label];
    });

    this._chart.update("none");
  }

  /** Entries start at the plot's left edge and must stay clear of the right-hand axis labels. */
  private _legendWidth(): number {
    const chart = this._chart;
    if (!chart) return 0;
    const area = chart.chartArea as { left: number; right: number } | undefined;
    return area ? area.right - area.left : chart.width;
  }

  private _measureLegendText(label: string): number {
    const ctx = this._chart?.ctx;
    if (
      !ctx ||
      typeof ctx.measureText !== "function" ||
      typeof ctx.save !== "function" ||
      typeof ctx.restore !== "function"
    ) {
      return label.length * 7;
    }

    ctx.save();
    ctx.font = `13px ${FONT_FAMILY}`;
    const width = ctx.measureText(label).width;
    ctx.restore();
    return width;
  }

  updateTheme(settings: ChartSettings): void {
    this.settings = settings;
    if (!this._chart) return;

    applyFinancialElementTheme(getFinancialPalette(settings.isDarkTheme ? "dark" : "light"));

    this._chart.options = buildFinancialChartOptions(
      baseOverlayOptions(this.volumeAxisSize, settings)
    );
    this._chart.options.onResize = this._onResize;
    this._chart.update("none");
  }

  /**
   * Apply sliced datasets from pre-computed full datasets. `endIndex` is
   * exclusive; omit it to run to the newest bar and its extra bars.
   */
  applySlicedData(fullMainDatasets: ChartDataset[], startIndex: number, endIndex?: number): void {
    if (!this._chart) return;

    // Price dataset (candlestick - index 0)
    const fullPrice = fullMainDatasets[0];
    const currentPrice = this._chart.data.datasets[0];
    if (fullPrice && currentPrice && fullPrice.type === "candlestick") {
      currentPrice.data = [...fullPrice.data.slice(startIndex, endIndex)];
    }

    // Volume dataset (bar - index 1)
    const fullVolume = fullMainDatasets[1];
    const currentVolume = this._chart.data.datasets[1];
    if (fullVolume && currentVolume && fullVolume.type === "bar") {
      currentVolume.data = [...fullVolume.data.slice(startIndex, endIndex)];
      if (fullVolume.backgroundColor && Array.isArray(fullVolume.backgroundColor)) {
        currentVolume.backgroundColor = [
          ...(fullVolume.backgroundColor as string[]).slice(startIndex, endIndex)
        ];
      }
    }

    this.fitVolumeAxis();

    // Match OscillatorChart.applySlicedData which also uses "none" — both charts
    // share the same setBarCount() trigger, so they must update with identical
    // semantics to avoid one snapping while the other transitions.
    this._chart.update("none");
  }

  /**
   * Size the volume axis from the bars now on screen, the way render() sizes it
   * from its initial window, so a pan or zoom never leaves the bars clipped or
   * flattened against a maximum measured on a different stretch of history.
   */
  private fitVolumeAxis(): void {
    const volumeAxis = this._chart?.options.scales?.["volumeAxis"];
    const volume = this._chart?.data.datasets[1];
    if (!volumeAxis || volume?.type !== "bar") return;

    const sizes = (volume.data as ScatterDataPoint[]).flatMap(point =>
      typeof point.y === "number" && Number.isFinite(point.y) ? [point.y] : []
    );
    const mean = sizes.length > 0 ? sizes.reduce((sum, y) => sum + y, 0) / sizes.length : 0;

    this.volumeAxisSize = 20 * mean || 0;
    volumeAxis.max = this.volumeAxisSize;
  }

  resize(): void {
    if (!this._chart) return;
    this._chart.resize();
    this._chart.update("resize");
  }

  /**
   * Tear down this OverlayChart and its underlying Chart.js instance. Releases
   * the cached legend selections, the volume-axis cache, and the Chart.js
   * canvas binding. Always call this from your component's unmount hook — not
   * `chart.destroy()`, which leaves library-level state orphaned.
   */
  destroy(): void {
    if (this._chart) {
      this._chart.destroy();
      this._chart = undefined;
    }
    this._latestLegendSelections = [];
    this.volumeAxisSize = 0;
  }
}
