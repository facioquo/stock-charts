import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api.service';
import { StyleService } from '../style.service';

import Chart from 'chart.js/auto';  // import all default options
import 'chartjs-adapter-date-fns';
import 'chartjs-chart-financial';

import { enUS } from 'date-fns/locale';
import { add, parseISO } from 'date-fns';
import { Guid } from "guid-typescript";

import {
  ChartConfiguration,
  ChartDataset,
  FinancialDataPoint,
  FontSpec,
  ScaleOptions,
  ScatterDataPoint,
  Tick
} from 'chart.js';

// extensions
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
} from 'chartjs-chart-financial';

// plugins
import annotationPlugin, { AnnotationOptions, ScaleValue }
  from 'chartjs-plugin-annotation';

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
} from './chart.models';

Chart.register(
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
  annotationPlugin);

@Injectable()
export class ChartService {

  constructor(
    private readonly api: ApiService,
    private readonly ts: StyleService
  ) { }

  yAxisTicks: Tick[] = [];
  listings: IndicatorListing[] = [];
  selections: IndicatorSelection[] = [];
  chartOverlay: Chart;

  // CHART CONFIGURATIONS
  baseConfig() {

    const commonXaxes = this.commonXAxes();
    const gridColor = this.ts.isDarkTheme ? '#424242' : '#CCCCCC';

    // solid background plugin (for copy/paste)
    const backgroundPlugin =
    {
      id: 'background',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = this.ts.isDarkTheme ? '#212121' : 'white';
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
            enabled: false,
            mode: 'index',
            intersect: false
          },
          annotation: {
            clip: false,
            drawTime: 'afterDraw',
            annotations: []
          }
        },
        layout: {
          padding: 0,
          autoPadding: false
        },
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          xAxis: commonXaxes,
          yAxis: {
            display: true,
            type: 'linear',
            axis: 'y',
            position: 'right',
            beginAtZero: false,
            ticks: {
              display: true,
              mirror: true,
              padding: -5,
              font: {
                size: 10,
                lineHeight: 1
              },
              showLabelBackdrop: true,
              backdropColor: this.ts.isDarkTheme ? '#212121' : 'white',
              backdropPadding: {
                top: 0,
                left: 2,
                bottom: 0,
                right: 2
              },
            },
            grid: {
              drawOnChartArea: true,
              drawTicks: false,
              drawBorder: false,
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
      beginAtZero: true
    } as ScaleOptions;

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    const config = this.baseConfig();

    // remove x-axis
    config.options.scales.xAxis.display = false;

    // top padding
    config.options.layout.padding = {
      top: 5,
      right: 0,
      bottom: 0,
      left: 0
    };

    // remove first and last y-axis labels
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

      if (index === 0 || index === values.length - 1) return null;
      else
        return value;
    };

    return config;
  }

  commonXAxes(): ScaleOptions {

    const axes: ScaleOptions = {
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
        source: "auto",
        padding: 0,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 9
        },
      },
      grid: {
        drawOnChartArea: false,
        drawBorder: false,
        tickLength: 2
      }
    };

    return axes;
  }

  // INDICATOR SELECTIONS
  defaultSelection(uiid: string): IndicatorSelection {

    const listing = this.listings.find(x => x.uiid == uiid);

    const selection: IndicatorSelection = {
      ucid: this.getGuid("chart"),
      uiid: listing.uiid,
      label: listing.labelTemplate,
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
        label: config.labelTemplate,
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

  selectionTokenReplacement(selection: IndicatorSelection): IndicatorSelection {

    selection.params.forEach((param, index) => {

      selection.label = selection.label.replace(`[P${index + 1}]`, param.value.toString());

      selection.results.forEach(r => {
        r.label = r.label.replace(`[P${index + 1}]`, param.value.toString());
      });
    });
    return selection;
  }

  addSelection(
    selection: IndicatorSelection,
    scrollToMe: boolean) {

    // replace tokens
    selection = this.selectionTokenReplacement(selection);

    // add to collection
    this.selections.push(selection);

    // lookup config data
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    this.api.getSelectionData(selection, listing)
      .subscribe({
        next: () => {

          // add needed charts
          if (selection.chartType == 'overlay') {
            this.addSelectionToOverlayChart(selection, scrollToMe);
          }
          else {
            this.addSelectionToNewChart(selection, listing, scrollToMe);
          };

          this.cacheSelections();
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
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
      const body = document.getElementById("main-content");
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

  addSelectionToNewChart(
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
    const qtyThresholds = listing.chartConfig.thresholds.length;

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
    chartConfig.options.plugins.tooltip.filter = (tooltipItem) =>
      (tooltipItem.datasetIndex > (qtyThresholds - 1));

    // y-scale
    chartConfig.options.scales.yAxis.min = listing.chartConfig?.minimumYAxis;
    chartConfig.options.scales.yAxis.max = listing.chartConfig?.maximumYAxis;

    // add selection
    selection.results.forEach((r: IndicatorResult) => {
      chartConfig.data.datasets.push(r.dataset);
    });


    // compose html
    const body = document.getElementById("main-content");
    const containerId = `${selection.ucid}-container`;

    // pre-delete, if exists (needed for theme change)
    const existing = document.getElementById(containerId);
    if (existing != null) {
      body.removeChild(existing);
    }

    // create chart container
    const container = document.createElement('div') as HTMLDivElement;
    container.id = containerId
    container.className = "chart-oscillator-container";

    // add chart
    const myCanvas = document.createElement('canvas') as HTMLCanvasElement;
    myCanvas.id = selection.ucid;
    container.appendChild(myCanvas);
    body.appendChild(container);

    if (selection.chart) selection.chart.destroy();
    selection.chart = new Chart(myCanvas.getContext("2d"), chartConfig);

    // annotations
    const xPos: ScaleValue = selection.chart.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = selection.chart.scales["yAxis"].getMinMax(false).max;

    const labelColor = this.ts.isDarkTheme ? '#757575' : '#212121';
    const annotation: AnnotationOptions =
      this.commonAnnotation(selection.label, labelColor, xPos, yPos, -2, 1);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();

    if (scrollToMe) this.scrollToEnd(container.id);
  }

  updateOverlayAnnotations() {

    const xPos: ScaleValue = this.chartOverlay.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = this.chartOverlay.scales["yAxis"].getMinMax(false).max;
    let adjY: number = 0;

    this.chartOverlay.options.plugins.annotation.annotations =
      this.selections
        .filter(x => x.chartType == 'overlay')
        .map((selection: IndicatorSelection, index: number) => {
          const annotation: AnnotationOptions =
            this.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, -2, adjY);
          annotation.id = "legend" + (index + 1).toString();
          adjY += 12;
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
      family: "Roboto",
      size: 11,
      style: "normal",
      weight: "normal",
      lineHeight: 1,
    };

    const annotation: AnnotationOptions = {
      type: 'label',
      content: [label],
      font: legendFont,
      color: fontColor,
      backgroundColor: this.ts.isDarkTheme ? 'rgba(33,33,33,0.5)' : 'rgba(255,255,255,0.7)',
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
        error: (e: HttpErrorResponse) => { console.log(e); }
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
        this.addSelection(selection, false);
      });
    }
    else { // add defaults
      const def1 = this.defaultSelection("EMA");
      this.addSelection(def1, false);

      const def2 = this.defaultSelection("BB");
      this.addSelection(def2, false);

      const def3 = this.defaultSelection("STO");
      this.addSelection(def3, false);

      const def4 = this.defaultSelection("RSI");
      def4.params.find(x => x.paramName == "lookbackPeriods").value = 5;
      this.addSelection(def4, false);
    }
  }

  resetChartTheme() {

    this.selections = [];
    this.loadCharts();
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
