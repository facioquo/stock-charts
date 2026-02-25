import { Chart, ChartConfiguration, ChartDataset, ChartTypeRegistry, TooltipItem } from "chart.js";

import { ScaleValue } from "chartjs-plugin-annotation";

import { baseOscillatorConfig, baseOscillatorOptions } from "../config/oscillator";
import { createThresholdDataset } from "../config/datasets";
import { commonLegendAnnotation } from "../config/annotations";
import {
  ChartSettings,
  ChartThreshold,
  ExtendedChartDataset,
  IndicatorListing,
  IndicatorResult,
  IndicatorSelection
} from "../config/types";

export class OscillatorChart {
  chart: Chart | undefined;
  private fullThresholdDatasets: ChartDataset[] = [];

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

    this.chart.options = baseOscillatorOptions(settings);
    this.chart.update("none");
  }

  /**
   * Apply sliced datasets from pre-computed full datasets.
   */
  applySlicedData(
    selection: IndicatorSelection,
    fullDatasets: ChartDataset[],
    startIndex: number
  ): void {
    // Slice threshold datasets (inserted before selection datasets in render)
    this.fullThresholdDatasets.forEach((fullDataset, i) => {
      if (!this.chart?.data.datasets[i]) return;
      if (fullDataset.data && Array.isArray(fullDataset.data)) {
        this.chart.data.datasets[i].data = [
          ...fullDataset.data.slice(startIndex)
        ];
      }
      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        this.chart.data.datasets[i].backgroundColor = [
          ...(fullDataset.backgroundColor as string[]).slice(startIndex)
        ];
      }
    });

    selection.results.forEach((result: IndicatorResult, resultIndex: number) => {
      if (!result.dataset || !fullDatasets[resultIndex]) return;

      const fullDataset = fullDatasets[resultIndex];
      if (!fullDataset.data || !Array.isArray(fullDataset.data)) return;

      result.dataset.data = [...fullDataset.data.slice(startIndex)];

      // Slice array properties
      const ext = fullDataset as ExtendedChartDataset;
      const resExt = result.dataset as ExtendedChartDataset;

      if (ext.pointRotation && Array.isArray(ext.pointRotation)) {
        resExt.pointRotation = ext.pointRotation
          .slice(startIndex)
          .map(v => (typeof v === "number" ? v : NaN));
      }

      if (ext.pointBackgroundColor && Array.isArray(ext.pointBackgroundColor)) {
        resExt.pointBackgroundColor = [...(ext.pointBackgroundColor as string[]).slice(startIndex)];
      }

      if (ext.pointBorderColor && Array.isArray(ext.pointBorderColor)) {
        resExt.pointBorderColor = [...(ext.pointBorderColor as string[]).slice(startIndex)];
      }

      if (fullDataset.backgroundColor && Array.isArray(fullDataset.backgroundColor)) {
        result.dataset.backgroundColor = [...(fullDataset.backgroundColor as string[]).slice(startIndex)];
      }
    });

    if (this.chart) {
      this.updateLegend(selection);
      this.chart.update();
    }
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
      this.fullThresholdDatasets.push(structuredClone(thresholdDataset) as ChartDataset);
    });

    // Hide thresholds from tooltips
    if ((qtyThresholds ?? 0) > 0 && chartConfig.options?.plugins?.tooltip) {
      chartConfig.options.plugins.tooltip.filter = (
        tooltipItem: TooltipItem<keyof ChartTypeRegistry>
      ) => tooltipItem.datasetIndex > (qtyThresholds ?? 0) - 1;
    }
  }

  private configureYAxis(chartConfig: ChartConfiguration, listing: IndicatorListing): void {
    if (chartConfig.options?.scales?.y) {
      chartConfig.options.scales.y.suggestedMin = listing.chartConfig?.minimumYAxis;
      chartConfig.options.scales.y.suggestedMax = listing.chartConfig?.maximumYAxis;
    }
  }
}
