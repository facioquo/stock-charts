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
  chart: Chart | undefined;
  private fullThresholdDatasets: IndicatorDataset[] = [];

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
    if (this.chart) this.chart.destroy();
    this.chart = new Chart(this.ctx, chartConfig);

    // Add legend (after scales are drawn)
    this.chart.update("none");
    this.updateLegend(selection);
    this.chart.update("none");
  }

  updateLegend(selection: IndicatorSelection): void {
    if (!this.chart) return;

    if (!this.chart.scales["x"] || !this.chart.scales["y"]) return;
    const xPos: ScaleValue = this.chart.scales["x"].min;
    const yPos: ScaleValue = this.chart.scales["y"].max;

    const annotation = commonLegendAnnotation(selection.label, xPos, yPos, 1, this.settings);

    if (this.chart.options?.plugins?.annotation) {
      this.chart.options.plugins.annotation.annotations = { annotation };
    }
  }

  updateTheme(settings: ChartSettings): void {
    this.settings = settings;
    if (!this.chart) return;

    // Preserve theme-specific runtime options from render() that must persist
    // across theme changes (tooltip filter for thresholds, y-axis suggested bounds)
    const newOptions = baseOscillatorOptions(settings);
    const existingOptions = this.chart.options;

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

    this.chart.options = newOptions;
    this.chart.update("none");
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
      if (!this.chart?.data.datasets[i]) return;
      if (fullDataset.data && Array.isArray(fullDataset.data)) {
        this.chart.data.datasets[i].data = [...fullDataset.data.slice(startIndex)];
      }
      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        this.chart.data.datasets[i].backgroundColor = [
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

      if (fullDataset.pointRotation) {
        ext.pointRotation = [...(fullDataset.pointRotation as number[]).slice(startIndex)];
      }

      if (fullDataset.pointBackgroundColor) {
        ext.pointBackgroundColor = [
          ...(fullDataset.pointBackgroundColor as string[]).slice(startIndex)
        ];
      }

      if (fullDataset.pointBorderColor) {
        ext.pointBorderColor = [...(fullDataset.pointBorderColor as string[]).slice(startIndex)];
      }

      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        result.dataset.backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex)
        ];
      }
    });

    if (!this.chart) return;

    // Two-pass update: first pass applies sliced data and recalculates scale
    // bounds; second pass renders the legend annotations (which read the fresh
    // scales from the first pass). Collapsing to one pass would leave
    // annotation positions stale.
    this.chart.update("none");
    this.updateLegend(selection);
    this.chart.update("none");
  }

  resize(): void {
    if (!this.chart) return;
    this.chart.resize();
    this.chart.update("resize");
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
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
