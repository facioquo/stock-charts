import { Chart, type ChartConfiguration } from "chart.js";

import {
  type AnnotationOptions,
  type LabelAnnotationOptions,
  type ScaleValue
} from "chartjs-plugin-annotation";

import { baseOscillatorConfig, baseOscillatorOptions } from "../config/oscillator";
import { createThresholdDataset } from "../config/datasets";
import {
  commonLegendAnnotation,
  legendSwatchAnnotation,
  measureLegendText
} from "../config/annotations";
import {
  LEGEND_ENTRY_GAP,
  LEGEND_ROW_HEIGHT,
  LEGEND_SWATCH_WIDTH,
  layoutLegend
} from "../config/legend";
import {
  type ChartSettings,
  type ChartThreshold,
  type ExtendedChartDataset,
  type IndicatorDataset,
  type IndicatorListing,
  type IndicatorResult,
  type IndicatorSelection
} from "../config/types";

/** Offset of the legend's first row below the top of the plot. */
const LEGEND_TOP_OFFSET = 1;

/** The lines a pane actually draws; `none` results are hidden datasets. */
function drawnResults(selection: IndicatorSelection): IndicatorResult[] {
  return selection.results.filter(result => result.lineType !== "none");
}

export class OscillatorChart {
  private _chart: Chart | undefined;
  private fullThresholdDatasets: IndicatorDataset[] = [];
  private _legendSelection: IndicatorSelection | undefined;

  /**
   * Underlying Chart.js instance. Exposed read-only — assigning to this field
   * is a TypeScript error. Read access (theme tweaks, dataset inspection) is
   * supported. **Do not call `chart.destroy()` directly** — use
   * {@link OscillatorChart.destroy} so library-level state (threshold dataset
   * caches, legend annotations) is released alongside the Chart.js teardown.
   */
  get chart(): Chart | undefined {
    return this._chart;
  }

  constructor(
    private readonly ctx: CanvasRenderingContext2D | HTMLCanvasElement,
    private settings: ChartSettings
  ) {}

  /**
   * Render an oscillator chart with the given selection and listing config.
   */
  render(selection: IndicatorSelection, listing: IndicatorListing): void {
    const chartConfig = baseOscillatorConfig(this.settings);
    // reset stored full threshold datasets for this render
    this.fullThresholdDatasets = [];

    // Add thresholds
    this.configureThresholds(chartConfig, selection, listing);

    // Configure y-axis bounds
    this.configureYAxis(chartConfig, listing);

    // Add selection datasets
    selection.results.forEach((r: IndicatorResult) => {
      chartConfig.data.datasets.push(r.dataset);
    });

    // A width change can re-wrap the series legend.
    if (chartConfig.options) chartConfig.options.onResize = this._onResize;

    // Create chart
    if (this._chart) this._chart.destroy();
    this._chart = new Chart(this.ctx, chartConfig);

    // Add legend (after scales are drawn)
    this._chart.update("none");
    this.updateLegend(selection);
    this._chart.update("none");
  }

  updateLegend(selection: IndicatorSelection): void {
    if (!this._chart) return;

    if (!this._chart.scales["x"] || !this._chart.scales["y"]) return;
    const xPos: ScaleValue = this._chart.scales["x"].min;
    const yPos: ScaleValue = this._chart.scales["y"].max;

    this._legendSelection = selection;
    const annotation = commonLegendAnnotation(
      selection.label,
      xPos,
      yPos,
      LEGEND_TOP_OFFSET,
      this.settings
    );

    const options = this._chart.options;
    if (!options?.plugins?.annotation) return;

    if (!this.showsSeriesLegend(selection)) {
      options.plugins.annotation.annotations = { annotation };
      return;
    }

    // A line labelled like the indicator, such as ADX(14), already names it.
    const repeated = drawnResults(selection).some(result => result.label === selection.label);
    const startX = repeated
      ? 0
      : measureLegendText(this._chart.ctx, selection.label) + LEGEND_ENTRY_GAP;
    const entries = this.seriesLegend(selection, xPos, yPos, startX);
    options.plugins.annotation.annotations = repeated ? entries : [annotation, ...entries];
  }

  private showsSeriesLegend(selection: IndicatorSelection): boolean {
    return this.settings.showSeriesLegend === true && drawnResults(selection).length > 1;
  }

  /**
   * A series-coloured swatch and label for each line, flowing from `startX` on
   * the first row and wrapping onto rows below it when the pane is narrow.
   */
  private seriesLegend(
    selection: IndicatorSelection,
    xPos: ScaleValue,
    yPos: ScaleValue,
    startX: number
  ): Array<AnnotationOptions & LabelAnnotationOptions> {
    const results = drawnResults(selection);
    const { slots } = layoutLegend(
      results.map(result => result.label),
      label => measureLegendText(this._chart?.ctx, label),
      this.legendWidth(),
      startX
    );

    return results.flatMap((result, index) => {
      const slot = slots[index];
      if (!slot) return [];

      const yAdjust = LEGEND_TOP_OFFSET + slot.row * LEGEND_ROW_HEIGHT;

      const label = commonLegendAnnotation(result.label, xPos, yPos, yAdjust, this.settings);
      label.id = "legend" + (index + 1).toString();
      label.xAdjust = slot.x + LEGEND_SWATCH_WIDTH;

      const swatch = legendSwatchAnnotation(
        result.color,
        xPos,
        yPos,
        yAdjust,
        slot.x,
        this.settings
      );
      swatch.id = label.id + "-swatch";

      return [swatch, label];
    });
  }

  /** Entries wrap before the right-hand axis labels, which draw inside the plot. */
  private legendWidth(): number {
    const chart = this._chart;
    if (!chart) return 0;
    const area = chart.chartArea as { left: number; right: number } | undefined;
    const plotWidth = area ? area.right - area.left : chart.width;
    return plotWidth - this.axisLabelWidth();
  }

  private axisLabelWidth(): number {
    const y = this._chart?.scales["y"];
    if (!y || this.settings.showRightAxisLabels === false) return 0;

    const widest = Math.max(
      0,
      ...y.ticks.map(tick =>
        tick.label == null ? 0 : measureLegendText(this._chart?.ctx, String(tick.label))
      )
    );
    return widest > 0 ? widest + LEGEND_ENTRY_GAP : 0;
  }

  // Deferred like the overlay's: Chart.js runs onResize before it updates the new layout.
  private readonly _onResize = (): void => {
    const selection = this._legendSelection;
    if (!selection || !this.showsSeriesLegend(selection)) return;
    queueMicrotask(() => {
      this.updateLegend(selection);
      this._chart?.update("none");
    });
  };

  updateTheme(settings: ChartSettings): void {
    this.settings = settings;
    if (!this._chart) return;

    // Preserve theme-specific runtime options from render() that must persist
    // across theme changes (y-axis suggested bounds)
    const newOptions = baseOscillatorOptions(settings);
    const existingOptions = this._chart.options;

    // Preserve y-axis suggested bounds (set by configureYAxis during render)
    type SuggestedBounds = { suggestedMin?: number; suggestedMax?: number };
    const existingY = existingOptions?.scales?.["y"] as SuggestedBounds | undefined;
    const newY = newOptions.scales?.["y"] as SuggestedBounds | undefined;
    if (existingY && newY && typeof existingY.suggestedMin === "number") {
      newY.suggestedMin = existingY.suggestedMin;
    }
    if (existingY && newY && typeof existingY.suggestedMax === "number") {
      newY.suggestedMax = existingY.suggestedMax;
    }

    newOptions.onResize = this._onResize;
    this._chart.options = newOptions;
    this._chart.update("none");
  }

  /**
   * Apply sliced datasets from pre-computed full datasets. `endIndex` is
   * exclusive; omit it to run to the newest bar and its extra bars.
   */
  applySlicedData(
    selection: IndicatorSelection,
    fullDatasets: IndicatorDataset[],
    startIndex: number,
    endIndex?: number
  ): void {
    // Slice threshold datasets (inserted before selection datasets in render)
    this.fullThresholdDatasets.forEach((fullDataset, i) => {
      if (!this._chart?.data.datasets[i]) return;
      if (fullDataset.data && Array.isArray(fullDataset.data)) {
        this._chart.data.datasets[i].data = [...fullDataset.data.slice(startIndex, endIndex)];
      }
      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        this._chart.data.datasets[i].backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex, endIndex)
        ];
      }
    });

    selection.results.forEach((result: IndicatorResult, resultIndex: number) => {
      if (!result.dataset || !fullDatasets[resultIndex]) return;

      const fullDataset = fullDatasets[resultIndex] as ExtendedChartDataset;
      if (!fullDataset.data || !Array.isArray(fullDataset.data)) return;

      result.dataset.data = [...fullDataset.data.slice(startIndex, endIndex)];
      const ext = result.dataset as ExtendedChartDataset;

      // Chart.js permits Scriptable / scalar forms for these fields on its
      // base type, so guard at runtime before slicing — the `as number[]` /
      // `as string[]` casts only quiet the compiler.
      if (Array.isArray(fullDataset.pointRotation)) {
        ext.pointRotation = [
          ...(fullDataset.pointRotation as number[]).slice(startIndex, endIndex)
        ];
      }

      if (Array.isArray(fullDataset.pointBackgroundColor)) {
        ext.pointBackgroundColor = [
          ...(fullDataset.pointBackgroundColor as string[]).slice(startIndex, endIndex)
        ];
      }

      if (Array.isArray(fullDataset.pointBorderColor)) {
        ext.pointBorderColor = [
          ...(fullDataset.pointBorderColor as string[]).slice(startIndex, endIndex)
        ];
      }

      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        result.dataset.backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex, endIndex)
        ];
      }
    });

    if (!this._chart) return;

    // Two-pass update: first pass applies sliced data and recalculates scale
    // bounds; second pass renders the legend annotations (which read the fresh
    // scales from the first pass). Collapsing to one pass would leave
    // annotation positions stale.
    this._chart.update("none");
    this.updateLegend(selection);
    this._chart.update("none");
  }

  resize(): void {
    if (!this._chart) return;
    this._chart.resize();
    this._chart.update("resize");
  }

  /**
   * Tear down this OscillatorChart and its underlying Chart.js instance.
   * Releases the cached threshold datasets and the Chart.js canvas binding.
   * Always call this from your component's unmount hook — not
   * `chart.destroy()`, which leaves library-level state orphaned.
   */
  destroy(): void {
    if (this._chart) {
      this._chart.destroy();
      this._chart = undefined;
    }
    this.fullThresholdDatasets = [];
    this._legendSelection = undefined;
  }

  private configureThresholds(
    chartConfig: ChartConfiguration,
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): void {
    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {
      const firstResult = selection.results?.[0];
      if (!firstResult) return;
      const thresholdDataset = createThresholdDataset(threshold, firstResult, index);
      chartConfig.data.datasets.push(thresholdDataset);
      // store a full (unsliced) copy for later dynamic slicing
      this.fullThresholdDatasets.push(structuredClone(thresholdDataset));
    });
  }

  private configureYAxis(chartConfig: ChartConfiguration, listing: IndicatorListing): void {
    if (chartConfig.options?.scales?.["y"]) {
      chartConfig.options.scales["y"].suggestedMin = listing.chartConfig?.minimumYAxis;
      chartConfig.options.scales["y"].suggestedMax = listing.chartConfig?.maximumYAxis;
    }
  }
}
