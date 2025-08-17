import { HttpErrorResponse } from "@angular/common/http";
import { inject, Injectable, OnDestroy, signal } from "@angular/core";
import { catchError, map, Observable, Subject, takeUntil } from "rxjs";

import {
  BarElement,
  Chart,
  ChartConfiguration,
  ChartData,
  ChartDataset,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScatterDataPoint,
  TimeSeriesScale,
  Tooltip,
  TooltipItem
} from "chart.js";

// Extended dataset interface for candlestick pattern datasets
type ExtendedChartDataset = ChartDataset & {
  pointRotation?: number[];
  pointBackgroundColor?: string[];
  pointBorderColor?: string[];
};

// extensions
import {
  FinancialDataPoint,
  buildCandlestickDataset,
  buildVolumeDataset
} from "../../chartjs/financial";

// plugins
import AnnotationPlugin, {
  AnnotationOptions,
  LabelAnnotationOptions,
  ScaleValue
} from "chartjs-plugin-annotation";

// register extensions and plugins
Chart.register(
  // controllers
  LineController,
  Tooltip,

  // elements
  BarElement,
  LineElement,
  PointElement,

  // plugins
  AnnotationPlugin,
  Filler,

  // scales
  LinearScale,
  TimeSeriesScale
);

// internal models
import {
  ChartThreshold,
  IndicatorDataRow,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Quote
} from "../pages/chart/chart.models";

// services
import { ApiService } from "./api.service";
import { ChartConfigService } from "./config.service";
import { UtilityService } from "./utility.service";
import { WindowService } from "./window.service";

@Injectable({
  providedIn: "root"
})
export class ChartService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly cfg = inject(ChartConfigService);
  private readonly util = inject(UtilityService);
  private readonly window = inject(WindowService);
  private readonly destroy$ = new Subject<void>();

  // Constants
  private static readonly EXTRA_BARS = 7;
  private static readonly CANDLE_HIGH_MULTIPLIER = 1.01;
  private static readonly CANDLE_LOW_MULTIPLIER = 0.99;
  private static readonly LEGEND_Y_OFFSET = 15;
  private static readonly THRESHOLD_ORDER_OFFSET = 100;

  // Chart type constants
  private static readonly CHART_TYPES = {
    OVERLAY: "overlay",
    OSCILLATOR: "oscillator"
  } as const;

  // Category constants
  private static readonly CATEGORIES = {
    CANDLESTICK_PATTERN: "candlestick-pattern"
  } as const;

  // Color constants
  private static readonly COLORS = {
    GREEN: "#2E7D32",
    GRAY: "#9E9E9E",
    RED: "#DD2C00",
    CANDLE_UP: "#1B5E20",
    CANDLE_DOWN: "#B71C1C",
    CANDLE_UNCHANGED: "#616161",
    VOLUME_UP: "#1B5E2060",
    VOLUME_DOWN: "#B71C1C60"
  };

  listings: IndicatorListing[] = [];
  selections: IndicatorSelection[] = [];
  chartOverlay?: Chart; // created after quotes load
  loading = signal(true);
  extraBars = ChartService.EXTRA_BARS;

  // Window-based sizing properties
  currentBarCount: number;
  allQuotes: Quote[] = []; // Store full quotes dataset for dynamic slicing
  allProcessedDatasets: Map<string, ChartDataset[]> = new Map(); // Store processed Chart.js datasets for efficient slicing

  constructor() {
    // Calculate initial bar count without arbitrary override
    this.currentBarCount = this.window.calculateOptimalBars();

    // Subscribe to window resize events with proper cleanup
    this.window
      .getResizeObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(dimensions => {
        this.onWindowResize(dimensions);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //#region SELECT/DISPLAY OPERATIONS
  addSelection(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean = false
  ): Observable<void> {
    return this.api.getSelectionData(selection, listing).pipe(
      map((data: IndicatorDataRow[]) => {
        this.processSelectionData(selection, listing, data);
        // replace tokens with values
        selection = this.selectionTokenReplacement(selection);
        // Store processed datasets for efficient resizing (deep copy)
        this.allProcessedDatasets.set(
          selection.ucid,
          selection.results.map(result => JSON.parse(JSON.stringify(result.dataset)))
        );
        this.displaySelection(selection, listing, scrollToMe);
      }),
      catchError((error: HttpErrorResponse) => {
        this.logHttpError("Chart Service Error", error);
        throw error;
      })
    );
  }

  private processSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    data: IndicatorDataRow[]
  ): void {
    selection.results.forEach((result: IndicatorResult) => {
      const resultConfig = listing.results.find(x => x.dataName === result.dataName);
      if (!resultConfig) return;
      const dataset = this.cfg.baseDataset(result, resultConfig);
      const { dataPoints, pointColor, pointRotation } = this.buildDataPoints(data, result, listing);
      this.addExtraBars(dataPoints);
      if (
        listing.category === ChartService.CATEGORIES.CANDLESTICK_PATTERN &&
        dataset &&
        dataset.type !== "bar"
      ) {
        const ext = dataset as ExtendedChartDataset;
        ext.pointRotation = pointRotation;
        ext.pointBackgroundColor = pointColor;
        ext.pointBorderColor = pointColor;
      }
      if (dataset) {
        (dataset as ChartDataset).data = dataPoints;
        result.dataset = dataset as ChartDataset;
      }
    });
  }

  private buildDataPoints(
    data: IndicatorDataRow[],
    result: IndicatorResult,
    listing: IndicatorListing
  ): { dataPoints: ScatterDataPoint[]; pointColor: string[]; pointRotation: number[] } {
    const dataPoints: ScatterDataPoint[] = [];
    const pointColor: string[] = [];
    const pointRotation: number[] = [];

    data.forEach(row => {
      let yValue =
        typeof row[result.dataName] === "number" ? (row[result.dataName] as number) : undefined;

      // apply candle pointers
      if (yValue && listing.category === ChartService.CATEGORIES.CANDLESTICK_PATTERN) {
        const candleConfig = this.getCandlePointConfiguration(
          row["match"] as number,
          row.candle as Quote
        );
        yValue = candleConfig.yValue;
        pointColor.push(candleConfig.color);
        pointRotation.push(candleConfig.rotation);
      } else {
        const resultConfig = listing.results.find(x => x.dataName === result.dataName);
        pointColor.push(resultConfig?.defaultColor ?? ChartService.COLORS.GRAY);
        pointRotation.push(0);
      }

      if (typeof yValue !== "number") {
        // skip undefined to satisfy strict typing; patterns with null are handled via addExtraBars
        yValue = NaN;
      }
      dataPoints.push({ x: new Date(row.date).valueOf(), y: yValue });
    });

    return { dataPoints, pointColor, pointRotation };
  }

  private getCandlePointConfiguration(
    match: number,
    candle: Quote
  ): { yValue: number; color: string; rotation: number } {
    switch (match) {
      case -100:
        return {
          yValue: ChartService.CANDLE_HIGH_MULTIPLIER * candle.high,
          color: ChartService.COLORS.RED,
          rotation: 180
        };
      case 100:
        return {
          yValue: ChartService.CANDLE_LOW_MULTIPLIER * candle.low,
          color: ChartService.COLORS.GREEN,
          rotation: 0
        };
      default:
        return {
          yValue: ChartService.CANDLE_LOW_MULTIPLIER * candle.low,
          color: ChartService.COLORS.GRAY,
          rotation: 0
        };
    }
  }

  private addExtraBars(dataPoints: ScatterDataPoint[]): void {
    const nextDate = new Date(Math.max(...dataPoints.map(h => new Date(h.x).getTime())));

    for (let i = 1; i < this.extraBars; i++) {
      nextDate.setDate(nextDate.getDate() + 1);
      dataPoints.push({ x: new Date(nextDate).valueOf(), y: Number.NaN });
    }
  }

  private logHttpError(context: string, error: HttpErrorResponse): void {
    console.error(context, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message
    });
  }

  addSelectionWithoutScroll(selection: IndicatorSelection) {
    // lookup config data
    const listing = this.listings.find(x => x.uiid === selection.uiid);
    if (!listing) return;

    // add to chart
    this.addSelection(selection, listing, false).subscribe(); // no need to wait
  }

  defaultSelection(uiid: string): IndicatorSelection {
    const listing = this.listings.find(x => x.uiid === uiid);
    if (!listing) {
      throw new Error(`Indicator listing not found for uiid: ${uiid}`);
    }

    // initialize selection
    const selection: IndicatorSelection = {
      ucid: this.util.guid("chart"),
      uiid: listing.uiid,
      label: listing.legendTemplate,
      chartType: listing.chartType,
      params: [],
      results: []
    };

    // load default parameters
    listing.parameters?.forEach((config: IndicatorParamConfig) => {
      const param = {
        paramName: config.paramName,
        displayName: config.displayName,
        minimum: config.minimum,
        maximum: config.maximum,
        value: config.defaultValue
      } as IndicatorParam;

      selection.params.push(param);
    });

    // load default results colors and containers
    listing.results.forEach((config: IndicatorResultConfig) => {
      const result = {
        label: config.tooltipTemplate,
        color: config.defaultColor,
        dataName: config.dataName,
        displayName: config.displayName,
        lineType: config.lineType,
        lineWidth: config.lineWidth,
        order: listing.order
      } as IndicatorResult;

      selection.results.push(result);
    });

    return selection;
  }

  cacheSelections() {
    // deep copy without the chart object
    const selections: IndicatorSelection[] = this.selections.map(sel => {
      const clone = { ...(sel as IndicatorSelection) } as IndicatorSelection & { chart?: unknown };
      delete clone.chart; // runtime-only property
      return clone;
    });

    localStorage.setItem("selections", JSON.stringify(selections));
  }

  displaySelection(
    selection: IndicatorSelection, // with data
    listing: IndicatorListing,
    scrollToMe: boolean
  ) {
    // add to collection
    this.selections.push(selection);

    // add needed charts
    if (listing.chartType === ChartService.CHART_TYPES.OVERLAY) {
      this.displaySelectionOnOverlayChart(selection, scrollToMe);
    } else {
      this.displaySelectionOnNewOscillator(selection, listing, scrollToMe);
    }

    this.cacheSelections();
  }

  displaySelectionOnOverlayChart(
    selection: IndicatorSelection, // with data
    scrollToMe: boolean
  ) {
    // add selection
    const overlay = this.chartOverlay;
    if (overlay) {
      selection.results.forEach((r: IndicatorResult) => {
        overlay.data.datasets.push(r.dataset);
      });
      overlay.update("none"); // ensures scales are drawn to correct size first
      this.addOverlayLegend();
      overlay.update("none");
    }

    if (scrollToMe) this.util.scrollToStart("chart-overlay");
  }

  displaySelectionOnNewOscillator(
    selection: IndicatorSelection, // with data
    listing: IndicatorListing,
    scrollToMe: boolean
  ) {
    // default configuration
    const chartConfig = this.cfg.baseOscillatorConfig();

    // add thresholds and configure chart
    this.configureOscillatorThresholds(chartConfig, selection, listing);
    this.configureOscillatorYAxis(chartConfig, listing);

    // add selection datasets
    selection.results.forEach((r: IndicatorResult) => {
      chartConfig.data.datasets.push(r.dataset);
    });

    // create and display chart
    this.createOscillatorChart(selection, chartConfig, scrollToMe);
  }

  private configureOscillatorThresholds(
    chartConfig: ChartConfiguration,
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): void {
    const qtyThresholds = listing.chartConfig?.thresholds?.length ?? 0;

    // add thresholds (reference lines)
    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {
      const thresholdDataset = this.createThresholdDataset(threshold, selection.results[0], index);
      chartConfig.data.datasets.push(thresholdDataset);
    });

    // hide thresholds from tooltips
    if ((qtyThresholds ?? 0) > 0 && chartConfig.options?.plugins?.tooltip) {
      chartConfig.options.plugins.tooltip.filter = (tooltipItem: TooltipItem<"line">) =>
        tooltipItem.datasetIndex > (qtyThresholds ?? 0) - 1;
    }
  }

  private createThresholdDataset(
    threshold: ChartThreshold,
    firstResult: IndicatorResult,
    index: number
  ): ChartDataset {
    // note: thresholds can't be annotated lines since
    // offset fill will only work between certain objects.
    const lineData: ScatterDataPoint[] = [];

    // compose threshold data
    firstResult.dataset.data.forEach((d: ScatterDataPoint) => {
      lineData.push({ x: d.x, y: threshold.value } as ScatterDataPoint);
    });

    return {
      label: "threshold",
      type: "line",
      data: lineData,
      yAxisID: "y",
      pointRadius: 0,
      borderWidth: 2.5,
      borderDash: threshold.style === "dash" ? [5, 2] : [],
      borderColor: threshold.color,
      backgroundColor: threshold.color,
      spanGaps: true,
      fill:
        threshold.fill == null
          ? false
          : {
              target: threshold.fill.target,
              above: threshold.fill.colorAbove,
              below: threshold.fill.colorBelow
            },
      order: index + ChartService.THRESHOLD_ORDER_OFFSET
    };
  }

  private configureOscillatorYAxis(
    chartConfig: ChartConfiguration,
    listing: IndicatorListing
  ): void {
    if (chartConfig.options?.scales?.y) {
      if (listing.chartConfig?.minimumYAxis != null) {
        (chartConfig.options.scales.y as unknown as { suggestedMin?: number }).suggestedMin = listing.chartConfig.minimumYAxis;
      }
      if (listing.chartConfig?.maximumYAxis != null) {
        (chartConfig.options.scales.y as unknown as { suggestedMax?: number }).suggestedMax = listing.chartConfig.maximumYAxis;
      }
    }
  }

  private createOscillatorChart(
    selection: IndicatorSelection,
    chartConfig: ChartConfiguration,
    scrollToMe: boolean
  ): void {
    // compose html
    const body = document.getElementById("oscillators-zone");
    const containerId = `${selection.ucid}-container`;

    // pre-delete, if exists (needed for theme change)
    const existing = document.getElementById(containerId);
    if (body && existing !== null) {
      body.removeChild(existing);
    }

    // create chart container
    const container = document.createElement("div") as HTMLDivElement;
    container.id = containerId;
    container.className = "chart-oscillator-container";

    // add chart
    const myCanvas = document.createElement("canvas") as HTMLCanvasElement;
    myCanvas.id = selection.ucid;
    container.appendChild(myCanvas);
    if (!body) return; // abort if oscillator zone not found
    body.appendChild(container);

    if (selection.chart) selection.chart.destroy();
    const ctx = myCanvas.getContext("2d");
    if (!ctx) return; // cannot create without context
    selection.chart = new Chart(ctx, chartConfig);

    // annotations (after scales are drawn)
    selection.chart.update("none");
    this.addOscillatorLegend(selection);

    // apply changes
    selection.chart.update("none");
    if (scrollToMe) this.util.scrollToEnd(container.id);
  }

  addOverlayLegend() {
    const chart = this.chartOverlay;
    if (!chart) return;
    const xPos: ScaleValue = chart.scales["x"].min;
    const yPos: ScaleValue = chart.scales["y"].max;
    let adjY = 10; // first position

    if (chart.options?.plugins?.annotation) {
      chart.options.plugins.annotation.annotations = this.getOverlaySelections().map(
        (selection: IndicatorSelection, index: number) => {
          const annotation = this.createLegendAnnotation(selection, xPos, yPos, adjY, index);
          adjY += ChartService.LEGEND_Y_OFFSET;
          return annotation;
        }
      );
    }
  }

  private getOverlaySelections(): IndicatorSelection[] {
    return this.selections
      .filter(x => x.chartType === ChartService.CHART_TYPES.OVERLAY)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  private createLegendAnnotation(
    selection: IndicatorSelection,
    xPos: ScaleValue,
    yPos: ScaleValue,
    adjY: number,
    index: number
  ): AnnotationOptions & LabelAnnotationOptions {
    // annotation with defaults
    const annotation: AnnotationOptions & LabelAnnotationOptions = this.cfg.commonLegendAnnotation(
      selection.label,
      xPos,
      yPos,
      adjY
    );

    // customize annotation
    annotation.id = "legend" + (index + 1).toString();
    annotation.color = selection.results[0].color;

    return annotation;
  }

  addOscillatorLegend(selection: IndicatorSelection) {
    const chart = selection.chart;
    if (!chart) return;
    const xPos: ScaleValue = chart.scales["x"].min;
    const yPos: ScaleValue = chart.scales["y"].max;

    const annotation = this.cfg.commonLegendAnnotation(selection.label, xPos, yPos, 1);

    if (chart.options?.plugins?.annotation) {
      chart.options.plugins.annotation.annotations = { annotation };
    }
  }

  deleteSelection(ucid: string) {
    const selection = this.selections.find(x => x.ucid === ucid);
    if (!selection) return;

    const sx = this.selections.indexOf(selection, 0);
    if (sx !== -1) {
      this.selections.splice(sx, 1);
    }

    // Clean up stored processed datasets
    this.allProcessedDatasets.delete(ucid);

    if (selection.chartType === ChartService.CHART_TYPES.OVERLAY) {
      const overlay = this.chartOverlay;
      if (overlay) {
        selection.results.forEach((result: IndicatorResult) => {
          const dx = overlay.data.datasets.indexOf(result.dataset, 0);
          if (dx !== -1) {
            overlay.data.datasets.splice(dx, 1);
          }
        });
        this.addOverlayLegend();
        overlay.update();
      }
    } else {
      // Destroy oscillator chart instance (avoid leaking canvases / event handlers)
      const body = document.getElementById("oscillators-zone");
      const container = document.getElementById(`${selection.ucid}-container`);
      if (container) {
        // Try to get chart instance via canvas lookup first
        const canvas = container.querySelector("canvas") as HTMLCanvasElement | null;
        let instance: Chart | undefined | null = null;
        if (canvas) {
          // Chart.getChart returns the existing chart instance for this canvas (Chart.js v4)
          instance = Chart.getChart(canvas);
        }
        // Fallback to stored reference on selection
        if (!instance && selection.chart) {
          instance = selection.chart;
        }
        if (instance) {
          try {
            instance.destroy();
          } catch (err) {
            console.warn("Failed to destroy oscillator chart", { ucid: selection.ucid, err });
          }
        }
        // Remove DOM node after destroying the chart
        if (body) body.removeChild(container);
        // Clear reference
        selection.chart = undefined;
      }
    }

    this.cacheSelections();
  }

  onSettingsChange() {
    // strategically update chart theme
    // without destroying and re-creating charts

    // update overlay chart
    if (this.chartOverlay) {
      // remember dynamic options to restore
      const volumeAxisSize = this.chartOverlay.scales.volumeAxis.max;

      // replace chart options (applies theme)
      this.chartOverlay.options = this.cfg.baseOverlayOptions(volumeAxisSize);

      // regenerate
      this.chartOverlay.update("none"); // load scales
      this.addOverlayLegend();

      // apply changes
      this.chartOverlay.update("none");
    }

    // update oscillator charts
    const charts = this.selections.filter(s => s.chartType === ChartService.CHART_TYPES.OSCILLATOR);

    charts.forEach((selection: IndicatorSelection) => {
      const chart = selection.chart;

      if (!chart) return;
      // replace chart options (applies theme)
      chart.options = this.cfg.baseOscillatorOptions();

      // regenerate annotations
      chart.update("none"); // load scales
      this.addOscillatorLegend(selection);

      // apply changes
      chart.update("none");
    });
  }
  //#endregion

  //#region WINDOW OPERATIONS

  onWindowResize(dimensions: { width: number; height: number }) {
    const newBarCount = this.window.calculateOptimalBars(dimensions.width);

    // Only update if bar count changed and we have data
    if (newBarCount !== this.currentBarCount && this.allQuotes.length > 0) {
      this.currentBarCount = newBarCount;
      this.updateChartsWithNewBarCount();
    }

    // Force chart resize to handle container dimension changes
    this.forceChartsResize();
  }

  private updateChartsWithNewBarCount() {
    console.log(`Updating charts with ${this.currentBarCount} bars (dynamic resize)`);

    // Update main overlay chart datasets with new bar count
    this.updateOverlayChartWithSlicedData();

    // Update all indicator datasets with sliced data
    this.updateIndicatorDatasetsWithSlicedData();

    // Force charts to resize after data updates for proper scaling
    this.forceChartsResize();
  }

  private updateOverlayChartWithSlicedData() {
    if (!this.chartOverlay) return;

    const fullMainDatasets = this.allProcessedDatasets.get("overlay-main");
    if (!fullMainDatasets) return;

    // Calculate slice indices for consistent x-axis across all datasets
    const totalQuotes = this.allQuotes.length;
    const startIndex = Math.max(0, totalQuotes - this.currentBarCount);

    // Update price dataset (candlestick dataset - typically index 0)
    const fullPriceDataset = fullMainDatasets[0];
    const currentPriceDataset = this.chartOverlay.data.datasets[0];
    if (fullPriceDataset && currentPriceDataset && fullPriceDataset.type === "candlestick") {
      // Replace the data array entirely (Chart.js better detects this change)
      currentPriceDataset.data = [...fullPriceDataset.data.slice(startIndex)];
    }

    // Update volume dataset (bar dataset - typically index 1)
    const fullVolumeDataset = fullMainDatasets[1];
    const currentVolumeDataset = this.chartOverlay.data.datasets[1];
    if (fullVolumeDataset && currentVolumeDataset && fullVolumeDataset.type === "bar") {
      // Replace the data array entirely
      currentVolumeDataset.data = [...fullVolumeDataset.data.slice(startIndex)];

      // Also slice the background colors array
      if (
        (fullVolumeDataset as unknown as { backgroundColor?: unknown }).backgroundColor && 
        Array.isArray((fullVolumeDataset as unknown as { backgroundColor: unknown[] }).backgroundColor)
      ) {
        (currentVolumeDataset as unknown as { backgroundColor: unknown[] }).backgroundColor = [
          ...(fullVolumeDataset as unknown as { backgroundColor: unknown[] }).backgroundColor.slice(startIndex)
        ];
      }
    }

    // Update overlay chart legends after data changes
    this.addOverlayLegend();
    this.chartOverlay.update();
  }

  private updateIndicatorDatasetsWithSlicedData() {
    // Use consistent slicing based on allQuotes length for all datasets
    const totalQuotes = this.allQuotes.length;
    const startIndex = Math.max(0, totalQuotes - this.currentBarCount);

    // Update each selection's datasets by slicing the processed Chart.js datasets
    this.selections.forEach(selection => {
      const fullDatasets = this.allProcessedDatasets.get(selection.ucid);
      if (!fullDatasets) return;

      // Update each result dataset for this selection
      selection.results.forEach((result: IndicatorResult, resultIndex: number) => {
        if (!result.dataset || !fullDatasets[resultIndex]) return;

        const fullDataset = fullDatasets[resultIndex];
        if (!fullDataset.data || !Array.isArray(fullDataset.data)) return;

        // Replace the dataset data array entirely (Chart.js better detects this change)
        result.dataset.data = [...fullDataset.data.slice(startIndex)];

        // Also slice any array properties like pointRotation, pointBackgroundColor, etc.
        const extendedDataset = fullDataset as ExtendedChartDataset;
        const resultExtended = result.dataset as ExtendedChartDataset;

        if (extendedDataset.pointRotation && Array.isArray(extendedDataset.pointRotation)) {
          const pr = extendedDataset.pointRotation
            .slice(startIndex)
            .filter((v): v is number => typeof v === "number");
          resultExtended.pointRotation = pr;
        }

        if (
          extendedDataset.pointBackgroundColor &&
          Array.isArray(extendedDataset.pointBackgroundColor)
        ) {
          resultExtended.pointBackgroundColor = [
            ...(extendedDataset.pointBackgroundColor as string[]).slice(startIndex)
          ];
        }

        if (extendedDataset.pointBorderColor && Array.isArray(extendedDataset.pointBorderColor)) {
          resultExtended.pointBorderColor = [
            ...(extendedDataset.pointBorderColor as string[]).slice(startIndex)
          ];
        }

        // Handle backgroundColor for bar charts (like volume)
        if (
          (fullDataset as unknown as { backgroundColor?: unknown }).backgroundColor && 
          Array.isArray((fullDataset as unknown as { backgroundColor: unknown[] }).backgroundColor)
        ) {
          (result.dataset as unknown as { backgroundColor: unknown[] }).backgroundColor = [
            ...(fullDataset as unknown as { backgroundColor: unknown[] }).backgroundColor.slice(startIndex)
          ];
        }
      });

      // Update oscillator legends after data changes
      if (selection.chartType === ChartService.CHART_TYPES.OSCILLATOR && selection.chart) {
        this.addOscillatorLegend(selection);
        selection.chart.update();
      }
    });
  }

  private forceChartsResize() {
    // Use requestAnimationFrame to ensure DOM changes are applied before resizing
    requestAnimationFrame(() => {
      this.resizeOverlayChart();
      this.resizeOscillatorCharts();
    });
  }

  private resizeOverlayChart() {
    if (this.chartOverlay) {
      // Let Chart.js automatically detect container dimensions
      this.chartOverlay.resize();
      this.chartOverlay.update("resize");
    }
  }

  private resizeOscillatorCharts() {
    this.selections.forEach(selection => {
      if (selection.chartType === ChartService.CHART_TYPES.OSCILLATOR && selection.chart) {
        // Let Chart.js automatically detect container dimensions
        selection.chart.resize();
        selection.chart.update("resize");
      }
    });
  }
  //#endregion

  //#region DATA OPERATIONS
  loadCharts() {
    console.log(`Loading charts with ${this.currentBarCount} bars`);

    // get data and load charts
    this.api.getQuotes().subscribe({
      next: (allQuotes: Quote[]) => {
        // Store full dataset for dynamic slicing
        this.allQuotes = allQuotes;

        // Slice array to desired length based on window size (keep newest data)
        const quotes = allQuotes.slice(-this.currentBarCount);

        // load base overlay chart
        this.loadOverlayChart(quotes);

        // add/load indicators
        this.api.getListings().subscribe({
          next: (listings: IndicatorListing[]) => {
            // load catalog
            this.listings = listings;

            // load indicators
            this.loadSelections();
          },
          error: (e: HttpErrorResponse) => {
            console.error("Error loading listings:", {
              status: e.status,
              statusText: e.statusText,
              message: e.message
            });
            // ensure loading flag cleared on error
            this.loading.set(false);
          },
          complete: () => {
            // listings loaded and selections processed
            this.loading.set(false);
          }
        });
      },
      error: (e: HttpErrorResponse) => {
        console.error("Error getting quotes:", {
          status: e.status,
          statusText: e.statusText,
          message: e.message
        });
        // ensure loading flag cleared on error
        this.loading.set(false);
      }
    });
  }

  private processQuotes(allQuotes: Quote[]): void {
    // Store full dataset for dynamic slicing
    this.allQuotes = allQuotes;

    // Slice array to desired length based on window size (keep newest data)
    const quotes = allQuotes.slice(-this.currentBarCount);

    // load base overlay chart
    this.loadOverlayChart(quotes);

    // add/load indicators
    this.loadIndicatorListings();
  }

  private loadIndicatorListings(): void {
    this.api.getListings().subscribe({
      next: (listings: IndicatorListing[]) => {
        // load catalog
        this.listings = listings;

        // load indicators
        this.loadSelections();
      },
      error: (e: HttpErrorResponse) => {
        this.logHttpError("Error loading listings", e);
      }
    });
  }

  loadOverlayChart(quotes: Quote[]) {
    // loads base with quotes only
    const { priceData, volumeData, volumeAxisSize } = this.processQuoteData(quotes);

    // define base datasets
    const chartData: ChartData = {
      datasets: [
        this.createPriceDataset(priceData),
        this.createVolumeDataset(volumeData, priceData)
      ]
    };

    // Create and display chart
    this.createOverlayChart(chartData, volumeAxisSize);
  }

  private processQuoteData(quotes: Quote[]): {
    priceData: FinancialDataPoint[];
    volumeData: ScatterDataPoint[];
    volumeAxisSize: number;
    volumeColors: string[];
  } {
    const priceData: FinancialDataPoint[] = [];
    const volumeData: ScatterDataPoint[] = [];
    const volumeColors: string[] = [];
    let sumVol = 0;

    quotes.forEach((q: Quote) => {
      priceData.push({
        x: new Date(q.date).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      });

      volumeData.push({
        x: new Date(q.date).valueOf(),
        y: q.volume
      });
      sumVol += q.volume;

      const color =
        q.close >= q.open ? ChartService.COLORS.VOLUME_UP : ChartService.COLORS.VOLUME_DOWN;
      volumeColors.push(color);
    });

    // add extra bars
    this.addExtraVolumeBarsBars(volumeData);

    // volume axis size
    const volumeAxisSize = 20 * (sumVol / volumeData.length) || 0;

    return { priceData, volumeData, volumeAxisSize, volumeColors };
  }

  private addExtraVolumeBarsBars(volumeData: ScatterDataPoint[]): void {
    const nextDate = new Date(Math.max(...volumeData.map(h => new Date(h.x).getTime())));

    for (let i = 1; i < this.extraBars; i++) {
      nextDate.setDate(nextDate.getDate() + 1);
      // intentionally excluding price (gap covered by volume)
      volumeData.push({
        x: new Date(nextDate).valueOf(),
        y: Number.NaN
      });
    }
  }

  private createPriceDataset(priceData: FinancialDataPoint[]): ChartDataset {
    const dataset = buildCandlestickDataset(priceData, {
      label: "Price",
      colors: {
        up: ChartService.COLORS.CANDLE_UP,
        down: ChartService.COLORS.CANDLE_DOWN,
        unchanged: ChartService.COLORS.CANDLE_UNCHANGED
      }
    });

    return {
      ...dataset,
      yAxisID: "y",
      order: 75
    };
  }

  private createVolumeDataset(
    volumeData: ScatterDataPoint[],
    priceData: FinancialDataPoint[]
  ): ChartDataset {
    const dataset = buildVolumeDataset(volumeData, priceData, {
      label: "Volume",
      yAxisID: "volumeAxis"
    });

    return {
      ...dataset,
      order: 76
    };
  }

  private createOverlayChart(chartData: ChartData, volumeAxisSize: number): void {
    // default overlay chart configuration
    const chartConfig = this.cfg.baseOverlayConfig(volumeAxisSize);

    // add chart data
    chartConfig.data = chartData;

    // Store the complete overlay chart datasets for efficient resizing (deep copy)
    this.allProcessedDatasets.set("overlay-main", JSON.parse(JSON.stringify(chartData.datasets)));

    // compose chart
    if (this.chartOverlay) this.chartOverlay.destroy();
    const myCanvas = document.getElementById("chartOverlay") as HTMLCanvasElement;
    const ctx = myCanvas.getContext("2d");
    if (!ctx) return; // cannot create chart without context
    this.chartOverlay = new Chart(ctx, chartConfig);
  }

  loadSelections() {
    // TODO: cache default JSON if not found, without loading
    // then  (a) compose layout asynchronously with placeholders (from listing/selection info only)
    //         » labels, styles, thresholds, etc. without primary data (except for chart overlay quotes)
    //           however, this may need a separate method to compose chart layout
    // while (b) get data asynchronously
    //   and (c) follow data with selection composition
    // PROBLEM: causing web vitals to be blocked

    // get from cache
    const selectionsString = localStorage.getItem("selections");
    if (!selectionsString) {
      // load defaults if no cache found
      this.loadDefaultSelections();
      return;
    }

    const selections = JSON.parse(selectionsString);

    if (selections) {
      selections.forEach((selection: IndicatorSelection) => {
        this.addSelectionWithoutScroll(selection);
      });

      return;
    }

    // Load defaults if no valid selections are found
    this.loadDefaultSelections();
  }

  private loadDefaultSelections() {
    const def1 = this.defaultSelection("LINEAR");
    const def1Param = def1.params.find(x => x.paramName === "lookbackPeriods");
    if (def1Param) def1Param.value = 50;
    this.addSelectionWithoutScroll(def1);

    const def2 = this.defaultSelection("BB");
    this.addSelectionWithoutScroll(def2);

    const def3 = this.defaultSelection("RSI");
    const def3Param = def3.params.find(x => x.paramName === "lookbackPeriods");
    if (def3Param) def3Param.value = 5;
    this.addSelectionWithoutScroll(def3);

    const def4 = this.defaultSelection("ADX");
    this.addSelectionWithoutScroll(def4);

    const def5 = this.defaultSelection("SUPERTREND");
    this.addSelectionWithoutScroll(def5);

    const def6 = this.defaultSelection("MACD");
    this.addSelectionWithoutScroll(def6);

    const def7 = this.defaultSelection("MARUBOZU");
    this.addSelectionWithoutScroll(def7);
  }
  //#endregion

  //#region UTILITIES

  selectionTokenReplacement(selection: IndicatorSelection): IndicatorSelection {
    selection.params.forEach((param, index) => {
      if (param.value === null || param.value === undefined) return;

      selection.label = selection.label.replace(`[P${index + 1}]`, param.value.toString());

      selection.results.forEach(r => {
        if (param.value != null) {
          r.label = r.label.replace(`[P${index + 1}]`, param.value.toString());
        }
      });
    });
    return selection;
  }
  //#endregion
}
