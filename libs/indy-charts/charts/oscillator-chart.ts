import { Chart, type ChartConfiguration, type ChartTypeRegistry, type TooltipItem } from "chart.js";

import { type ScaleValue } from "chartjs-plugin-annotation";

import { baseOscillatorConfig, baseOscillatorOptions } from "../config/oscillator";
import { createThresholdDataset } from "../config/datasets";
import { commonLegendAnnotation } from "../config/annotations";
import {
  type ChartSettings,
  type ChartThreshold,
  type ExtendedChartDataset,
  type IndicatorDataset,
  type IndicatorListing,
  type IndicatorResult,
  type IndicatorSelection
} from "../config/types";

export class OscillatorChart {
  private _chart: Chart | undefined;
  private fullThresholdDatasets: IndicatorDataset[] = [];

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

    const annotation = commonLegendAnnotation(selection.label, xPos, yPos, 1, this.settings);

    if (this._chart.options?.plugins?.annotation) {
      this._chart.options.plugins.annotation.annotations = { annotation };
    }
  }

  updateTheme(settings: ChartSettings): void {
    this.settings = settings;
    if (!this._chart) return;

    // Preserve theme-specific runtime options from render() that must persist
    // across theme changes (tooltip filter for thresholds, y-axis suggested bounds)
    const newOptions = baseOscillatorOptions(settings);
    const existingOptions = this._chart.options;

    // Preserve tooltip filter (filters out threshold datasets from tooltips)
    if (existingOptions?.plugins?.tooltip?.filter && newOptions.plugins?.tooltip) {
      newOptions.plugins.tooltip.filter = existingOptions.plugins.tooltip.filter;
    }

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

    this._chart.options = newOptions;
    this._chart.update("none");
  }

  /**
   * Apply sliced datasets from pre-computed full datasets.
   */
  applySlicedData(
    selection: IndicatorSelection,
    fullDatasets: IndicatorDataset[],
    startIndex: number
  ): void {
    // Slice threshold datasets (inserted before selection datasets in render)
    this.fullThresholdDatasets.forEach((fullDataset, i) => {
      if (!this._chart?.data.datasets[i]) return;
      if (fullDataset.data && Array.isArray(fullDataset.data)) {
        this._chart.data.datasets[i].data = [...fullDataset.data.slice(startIndex)];
      }
      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        this._chart.data.datasets[i].backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex)
        ];
      }
    });

    selection.results.forEach((result: IndicatorResult, resultIndex: number) => {
      if (!result.dataset || !fullDatasets[resultIndex]) return;

      const fullDataset = fullDatasets[resultIndex] as ExtendedChartDataset;
      if (!fullDataset.data || !Array.isArray(fullDataset.data)) return;

      result.dataset.data = [...fullDataset.data.slice(startIndex)];
      const ext = result.dataset as ExtendedChartDataset;

      // Chart.js permits Scriptable / scalar forms for these fields on its
      // base type, so guard at runtime before slicing — the `as number[]` /
      // `as string[]` casts only quiet the compiler.
      if (Array.isArray(fullDataset.pointRotation)) {
        ext.pointRotation = [...(fullDataset.pointRotation as number[]).slice(startIndex)];
      }

      if (Array.isArray(fullDataset.pointBackgroundColor)) {
        ext.pointBackgroundColor = [
          ...(fullDataset.pointBackgroundColor as string[]).slice(startIndex)
        ];
      }

      if (Array.isArray(fullDataset.pointBorderColor)) {
        ext.pointBorderColor = [...(fullDataset.pointBorderColor as string[]).slice(startIndex)];
      }

      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        result.dataset.backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex)
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
  }

  private configureThresholds(
    chartConfig: ChartConfiguration,
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): void {
    const qtyThresholds = listing.chartConfig?.thresholds?.length ?? 0;

    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {
      const firstResult = selection.results?.[0];
      if (!firstResult) return;
      const thresholdDataset = createThresholdDataset(threshold, firstResult, index);
      chartConfig.data.datasets.push(thresholdDataset);
      // store a full (unsliced) copy for later dynamic slicing
      this.fullThresholdDatasets.push(structuredClone(thresholdDataset));
    });

    // Hide thresholds from tooltips
    if ((qtyThresholds ?? 0) > 0 && chartConfig.options?.plugins?.tooltip) {
      chartConfig.options.plugins.tooltip.filter = (
        tooltipItem: TooltipItem<keyof ChartTypeRegistry>
      ) => tooltipItem.datasetIndex > (qtyThresholds ?? 0) - 1;
    }
  }

  private configureYAxis(chartConfig: ChartConfiguration, listing: IndicatorListing): void {
    if (chartConfig.options?.scales?.["y"]) {
      chartConfig.options.scales["y"].suggestedMin = listing.chartConfig?.minimumYAxis;
      chartConfig.options.scales["y"].suggestedMax = listing.chartConfig?.maximumYAxis;
    }
  }
}
