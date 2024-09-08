import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api.service';
import { ConfigService } from './config.service';

import Chart from 'chart.js/auto';  // import all default options
import 'chartjs-adapter-date-fns';

import { enUS } from 'date-fns/locale';
import { Guid } from "guid-typescript";

import {
  CartesianScaleOptions,
  ChartConfiguration,
  ChartDataset,
  FontSpec,
  ScaleOptions,
  ScatterDataPoint,
  Tick
} from 'chart.js';

// extensions
import {
  CandlestickController,
  CandlestickElement,
  FinancialDataPoint,
  OhlcController,
  OhlcElement
} from 'src/assets/js/chartjs-chart-financial';

// plugins
import AnnotationPlugin, { AnnotationOptions, ScaleValue }
  from 'chartjs-plugin-annotation';

import CrosshairPlugin, { CrosshairOptions }
  from 'src/assets/js/chartjs-plugin-crosshair';

// register extensions and plugins
Chart.register(
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
  AnnotationPlugin,
  CrosshairPlugin);

// internal models
import {
  ChartThreshold,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection,
  Quote
} from '../chart/chart.models';

@Injectable()
export class ChartService {

  yAxisTicks: Tick[] = [];
  listings: IndicatorListing[] = [];
  selections: IndicatorSelection[] = [];
  chartOverlay: Chart;
  loading = true;

  constructor(
    private readonly api: ApiService,
    private readonly cfg: ConfigService
  ) { }

  // CHART CONFIGURATIONS

  resetCharts() {

    this.selections = [];
    this.loadCharts();
  }

  baseConfig() {

    const commonXaxes = this.commonXAxes();
    const crosshairOptions = this.crosshairPluginOptions();
    const gridColor = this.cfg.isDarkTheme ? '#424242' : '#CCCCCC';

    // solid background plugin (for copy/paste)
    const backgroundPlugin =
    {
      id: 'background',
      beforeDraw: (chart: Chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = this.cfg.isDarkTheme ? '#212121' : 'white';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    };

    // base configuration
    const config: ChartConfiguration = {

      type: 'candlestick',
      data: {
        datasets: []
      },
      plugins: [
        backgroundPlugin
      ],
      options: {
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: this.cfg.showTooltips,
            mode: 'interpolate',
            intersect: false
          },
          annotation: {
            clip: false,
            annotations: []
          },
          crosshair: crosshairOptions
        },
        layout: {
          padding: {
            top: 0,
            left: 1,
            bottom: 0,
            right: 1
          },
          autoPadding: false
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          xAxis: commonXaxes,
          yAxis: {
            alignToPixels: true,
            display: true,
            type: 'linear',
            axis: 'y',
            position: 'right',
            beginAtZero: false,
            ticks: {
              display: true,
              mirror: true,
              font: {
                family: "Google Sans",
                size: 12,
                lineHeight: 1
              },
              showLabelBackdrop: true,
              backdropColor: this.cfg.isDarkTheme ? '#212121' : 'white',
              backdropPadding: {
                top: 0,
                left: 5,
                bottom: 0,
                right: 0
              },
              padding: 0
            },
            border: {
              display: false
            },
            grid: {
              drawOnChartArea: true,
              drawTicks: false,
              lineWidth: 0.5,
              color: function (context) {
                if (context.tick.label === null) {
                  return 'transparent';
                } else {
                  return gridColor;
                }
              },
            }
          }
        }
      }
    };

    return config;
  }

  baseOverlayConfig(): ChartConfiguration {

    const config = this.baseConfig();
    config.type = 'candlestick';

    // format y-axis, add dollar sign
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

      if (index === 0 || index === values.length - 1) return null;
      else
        return '$' + value;
    };

    // volume axis
    config.options.scales.volumeAxis = {
      display: false,
      type: 'linear',
      axis: 'y',
      position: 'left',
      beginAtZero: true,
      padding: 0,
      border: {
        display: false
      }
    } as ScaleOptions;

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    const config = this.baseConfig();
    const y = config.options.scales.yAxis as CartesianScaleOptions;

    // remove x-axis
    config.options.scales.xAxis.display = false;

    // size to data, instead of next tick
    // y.bounds = "data";

    // remove first and last y-axis labels
    y.ticks.callback = (value: number, index, values) => {

      this.yAxisTicks = values;
      const v = Math.abs(value);

      if (index === 0 || index === values.length - 1) return null;

      // otherwise, condense large/small display values
      else if (v > 10000000000)
        return Math.trunc(value / 1000000000) + "B";
      else if (v > 10000000)
        return Math.trunc(value / 1000000) + "M";
      else if (v > 10000)
        return Math.trunc(value / 1000) + "K";
      else if (v > 10)
        return Math.trunc(value);
      else if (v > 0)
        return Math.round((value + Number.EPSILON) * 10) / 10;
      else if (v > 0.001)
        return Math.round((value + Number.EPSILON) * 100000) / 100000;
      else
        return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
    };

    return config;
  }

  commonXAxes(): ScaleOptions {

    const axes: ScaleOptions = {
      alignToPixels: true,
      display: false,
      type: 'timeseries',
      time: {
        unit: 'day'
      },
      adapters: {
        date: {
          locale: enUS
        },
      },
      ticks: {
        display: false,
        source: "auto",
        padding: 0,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 9
        },
      },
      border: {
        display: false
      },
      grid: {
        display: false,
        drawOnChartArea: false
      }
    };

    return axes;
  }

  crosshairPluginOptions(): CrosshairOptions {

    if (this.cfg.showCrosshairs == false) return null;

    const crosshairOptions: CrosshairOptions = {
      line: {
        color: '#F66',                                      // crosshair line color
        width: 1                                            // crosshair line width
      },
      sync: {
        enabled: true,                                      // enable trace line syncing with other charts
        group: 1,                                           // chart group (can be unique set of groups)
        suppressTooltips: true                              // suppress tooltips when showing a synced tracer
      },
      zoom: {
        enabled: false,                                     // enable zooming
        zoomboxBackgroundColor: 'rgba(66,133,244,0.2)',     // background color of zoom box
        zoomboxBorderColor: '#48F',                         // border color of zoom box
        zoomButtonText: 'Reset Zoom',                       // reset zoom button text
        zoomButtonClass: 'reset-zoom',                      // reset zoom button class
      },
      snap: {
        enabled: true
      },
      callbacks: {
        beforeZoom: (start, end) => {                       // called before zoom, return false to prevent zoom
          return false;
        },
        afterZoom: (start, end) => {                        // called after zoom
        }
      }
    };

    return crosshairOptions;
  }

  // INDICATOR SELECTIONS
  defaultSelection(uiid: string): IndicatorSelection {

    const listing = this.listings.find(x => x.uiid == uiid);

    const selection: IndicatorSelection = {
      ucid: this.getGuid("chart"),
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
      } as IndicatorParam

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
      } as IndicatorResult

      selection.results.push(result);
    });

    return selection;
  }

  addSelectionWithoutScroll(
    selection: IndicatorSelection
  ) {

    // lookup config data
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    this.api.getSelection(selection, listing)
      .subscribe({
        next: (selectionWithData: IndicatorSelection) => {

          this.displaySelection(selectionWithData, listing, false);
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  displaySelection(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean
  ) {

    // add to collection
    this.selections.push(selection);

    // add needed charts
    if (listing.chartType == 'overlay') {
      this.addSelectionToOverlayChart(selection, scrollToMe);
    }
    else {
      this.addSelectionToNewOscillator(selection, listing, scrollToMe);
    };

    this.cacheSelections();

  }

  deleteSelection(ucid: string) {

    const selection = this.selections.find(x => x.ucid == ucid);

    const sx = this.selections.indexOf(selection, 0);
    this.selections.splice(sx, 1);

    if (selection.chartType == "overlay") {

      selection.results.forEach((result: IndicatorResult) => {
        const dx = this.chartOverlay.data.datasets.indexOf(result.dataset, 0);
        this.chartOverlay.data.datasets.splice(dx, 1);
      });
      this.updateOverlayAnnotations();
      this.chartOverlay.update();

    } else {
      const body = document.getElementById("oscillators-zone");
      const chart = document.getElementById(`${selection.ucid}-container`);
      body.removeChild(chart);
    }

    this.cacheSelections();
  }

  cacheSelections() {

    const selections = this.selections;

    // remove unsavable data
    selections.forEach((selection: IndicatorSelection) => {
      selection.chart = undefined;
    });

    localStorage.setItem('selections', JSON.stringify(selections));
  }

  // CHARTS OPERATIONS
  addSelectionToOverlayChart(
    selection: IndicatorSelection,
    scrollToMe: boolean) {

    // add selection
    selection.results.forEach((r: IndicatorResult) => {
      this.chartOverlay.data.datasets.push(r.dataset);
    });
    this.chartOverlay.update(); // ensures scales are drawn to correct size first
    this.updateOverlayAnnotations();
    this.chartOverlay.update();

    if (scrollToMe) this.scrollToStart("chart-overlay");
  }

  addSelectionToNewOscillator(
    selection: IndicatorSelection,
    listing: IndicatorListing,
    scrollToMe: boolean) {
    const chartConfig = this.baseOscillatorConfig();

    // initialize chart datasets
    chartConfig.data = {
      datasets: []
    };

    // chart configurations

    // add thresholds (reference lines)
    const qtyThresholds = listing.chartConfig?.thresholds?.length;

    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {

      const lineData: ScatterDataPoint[] = [];

      // compose threshold data
      selection.results[0].dataset.data.forEach((d: ScatterDataPoint) => {
        lineData.push({ x: d.x, y: threshold.value } as ScatterDataPoint);
      });

      const thresholdDataset: ChartDataset = {
        label: "threshold",
        type: 'line',
        data: lineData,
        yAxisID: 'yAxis',
        pointRadius: 0,
        borderWidth: 2.5,
        borderDash: threshold.style == "dash" ? [5, 2] : [],
        borderColor: threshold.color,
        backgroundColor: threshold.color,
        spanGaps: true,
        fill: threshold.fill == null ? false : {
          target: threshold.fill.target,
          above: threshold.fill.colorAbove,
          below: threshold.fill.colorBelow
        },
        order: index + 100
      };

      chartConfig.data.datasets.push(thresholdDataset);
    });

    // hide thresholds from tooltips
    if (qtyThresholds > 0) {
      chartConfig.options.plugins.tooltip.filter = (tooltipItem) =>
        (tooltipItem.datasetIndex > (qtyThresholds - 1));
    }

    // y-scale
    chartConfig.options.scales.yAxis.suggestedMin = listing.chartConfig?.minimumYAxis;
    chartConfig.options.scales.yAxis.suggestedMax = listing.chartConfig?.maximumYAxis;

    // add selection
    selection.results.forEach((r: IndicatorResult) => {
      chartConfig.data.datasets.push(r.dataset);
    });

    // compose html
    const body = document.getElementById("oscillators-zone");
    const containerId = `${selection.ucid}-container`;

    // pre-delete, if exists (needed for theme change)
    const existing = document.getElementById(containerId);
    if (existing != null) {
      body.removeChild(existing);
    }

    // create chart container
    const container = document.createElement('div') as HTMLDivElement;
    container.id = containerId;
    container.className = "chart-oscillator-container";

    // add chart
    const myCanvas = document.createElement('canvas') as HTMLCanvasElement;
    myCanvas.id = selection.ucid;
    container.appendChild(myCanvas);
    body.appendChild(container);

    if (selection.chart) selection.chart.destroy();
    selection.chart = new Chart(myCanvas.getContext("2d"), chartConfig);

    // annotations
    const xPos: ScaleValue = selection.chart.scales["xAxis"].min;
    const yPos: ScaleValue = selection.chart.scales["yAxis"].max;

    const labelColor = this.cfg.isDarkTheme ? '#757575' : '#212121';
    const annotation: AnnotationOptions =
      this.commonAnnotation(selection.label, labelColor, xPos, yPos, 0, 1);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();


    if (scrollToMe) this.scrollToEnd(container.id);
  }

  updateOverlayAnnotations() {

    const xPos: ScaleValue = this.chartOverlay.scales["xAxis"].min;
    const yPos: ScaleValue = this.chartOverlay.scales["yAxis"].max;
    let adjY: number = 10;

    this.chartOverlay.options.plugins.annotation.annotations =
      this.selections
        .filter(x => x.chartType == 'overlay')
        .map((selection: IndicatorSelection, index: number) => {
          const annotation: AnnotationOptions =
            this.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, 0, adjY);
          annotation.id = "legend" + (index + 1).toString();
          adjY += 15;
          return annotation;
        });
  }

  commonAnnotation(
    label: string,
    fontColor: string,
    xPos: ScaleValue,
    yPos: ScaleValue,
    xAdj: number = 0,
    yAdj: number = 0
  ): AnnotationOptions {

    const legendFont: FontSpec = {
      family: "Google Sans",
      size: 13,
      style: "normal",
      weight: "normal",
      lineHeight: 1,
    };

    const annotation: AnnotationOptions = {
      type: 'label',
      content: [label],
      font: legendFont,
      color: fontColor,
      backgroundColor: this.cfg.isDarkTheme ? 'rgba(33,33,33,0.5)' : 'rgba(255,255,255,0.7)',
      padding: 0,
      position: 'start',
      xScaleID: 'xAxis',
      yScaleID: 'yAxis',
      xValue: xPos,
      yValue: yPos,
      xAdjust: xAdj,
      yAdjust: yAdj
    };

    return annotation;
  }

  // DATA OPERATIONS
  loadCharts() {
    this.api.getQuotes()
      .subscribe({
        next: (quotes: Quote[]) => {

          this.loadOverlayChart(quotes);

          // load default selections
          this.api.getListings()
            .subscribe({
              next: (listings: IndicatorListing[]) => {
                this.listings = listings;
                this.loadSelections();
              },
              error: (e: HttpErrorResponse) => { console.log(e); }
            });
        },
        error: (e: HttpErrorResponse) => { console.log(e); },
        complete: () => {
          this.loading = false;
        }
      });
  }

  loadOverlayChart(quotes: Quote[]) {

    const chartConfig = this.baseOverlayConfig();
    const candleOptions = Chart.defaults.elements["candlestick"];

    // custom border colors
    candleOptions.color.up = '#1B5E20';
    candleOptions.color.down = '#B71C1C';
    candleOptions.color.unchanged = '#616161';

    candleOptions.borderColor = {
      up: candleOptions.color.up,
      down: candleOptions.color.down,
      unchanged: candleOptions.color.unchanged
    };

    const price: FinancialDataPoint[] = [];
    const volume: ScatterDataPoint[] = [];
    const barColor: string[] = [];

    let sumVol = 0;

    quotes.forEach((q: Quote) => {

      price.push({
        x: new Date(q.date).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      });

      volume.push({
        x: new Date(q.date).valueOf(),
        y: q.volume
      });
      sumVol += q.volume;

      const c = (q.close >= q.open) ? '#1B5E2060' : '#B71C1C60';
      barColor.push(c);
    });

    // add extra bars
    const nextDate = new Date(Math.max.apply(null, quotes.map(h => new Date(h.date))));

    for (let i = 1; i < this.api.extraBars; i++) {
      nextDate.setDate(nextDate.getDate() + 1);

      // intentionally excluding price (gap covered by volume)
      volume.push({
        x: new Date(nextDate).valueOf(),
        y: null
      });
    }

    // define base datasets
    chartConfig.data = {
      datasets: [
        {
          type: 'candlestick',
          label: 'Price',
          data: price,
          yAxisID: 'yAxis',
          borderColor: candleOptions.borderColor,
          order: 75
        },
        {
          type: 'bar',
          label: 'Volume',
          data: volume,
          yAxisID: 'volumeAxis',
          backgroundColor: barColor,
          borderWidth: 0,
          order: 76
        }
      ]
    };

    // get size for volume axis
    const volumeAxisSize = 20 * (sumVol / volume.length) || 0;
    chartConfig.options.scales.volumeAxis.max = volumeAxisSize;

    // compose chart
    if (this.chartOverlay) this.chartOverlay.destroy();
    const myCanvas = document.getElementById("chartOverlay") as HTMLCanvasElement;
    this.chartOverlay = new Chart(myCanvas.getContext('2d'), chartConfig);
  }

  loadSelections() {

    // get from cache
    const selections = JSON.parse(localStorage.getItem('selections'));

    if (selections) {
      selections.forEach((selection: IndicatorSelection) => {
        this.addSelectionWithoutScroll(selection);
      });
    }
    else { // add defaults
      const def1 = this.defaultSelection("LINEAR");
      def1.params.find(x => x.paramName == "lookbackPeriods").value = 50;
      this.addSelectionWithoutScroll(def1);

      const def2 = this.defaultSelection("BB");
      this.addSelectionWithoutScroll(def2);

      const def3 = this.defaultSelection("RSI");
      def3.params.find(x => x.paramName == "lookbackPeriods").value = 5;
      this.addSelectionWithoutScroll(def3);

      const def4 = this.defaultSelection("ADX");
      this.addSelectionWithoutScroll(def4);

      const def5 = this.defaultSelection("SUPERTREND");
      this.addSelectionWithoutScroll(def5);

      const def6 = this.defaultSelection("MACD");
      this.addSelectionWithoutScroll(def6);
    }
  }

  // helper functions
  getGuid(prefix: string = "chart"): string {
    return `${prefix}${Guid.create().toString().replace(/-/gi, "")}`;
  }

  scrollToStart(id: string) {
    setTimeout(() => {
      const element = document.getElementById(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }

  scrollToEnd(id: string) {
    setTimeout(() => {
      const element = document.getElementById(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
    }, 200);
  }
}
