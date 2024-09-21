import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';

import { ApiService } from './api.service';
import { ChartConfigService } from './chart-config.service';
import { UserConfigService } from './user-config.service';

import { v4 as Guid } from 'uuid';

import {
  BarController,
  BarElement,
  Chart,
  ChartData,
  ChartDataset,
  FinancialDataPoint,
  FontSpec,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScaleOptions,
  ScatterDataPoint,
  Tick,
  TimeSeriesScale,
  Tooltip
} from 'chart.js';

// extensions
import {
  CandlestickController,
  CandlestickElement
} from 'src/assets/js/chartjs-chart-financial';

// plugins
import AnnotationPlugin, { AnnotationOptions, ScaleValue }
  from 'chartjs-plugin-annotation';

import CrosshairPlugin
  from 'src/assets/js/chartjs-plugin-crosshair';

// register extensions and plugins
Chart.register(

  // controllers
  BarController,
  CandlestickController,
  LineController,
  Tooltip,

  // elements
  BarElement,
  CandlestickElement,
  LineElement,
  PointElement,

  // plugins
  AnnotationPlugin,
  CrosshairPlugin,

  // scales
  LinearScale,
  TimeSeriesScale
);

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
export class ChartControlService {

  listings: IndicatorListing[] = [];
  selections: IndicatorSelection[] = [];
  chartOverlay: Chart;
  loading = true;
  extraBars = 7;

  constructor(
    private readonly api: ApiService,
    private readonly cfg: ChartConfigService,
    private readonly usr: UserConfigService  // TODO: move usage to config service
  ) { }


  //#region SELECTION MGMT
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

  addSelectionPicked(
    selection: IndicatorSelection,
    listing: IndicatorListing): Observable<any> {

    const green = "#2E7D32";
    const gray = "#9E9E9E";
    const red = "#DD2C00";

    // load selection to chart
    const obs = new Observable((observer) => {

      // TODO: we really only want to return API observable
      // here to catch backend validation errors only, not more.

      // fetch API data
      this.api.getSelectionData(selection, listing)
        .subscribe({

          // compose datasets
          next: (data: any[]) => {

            // compose datasets
            // parse each dataset
            selection.results
              .forEach((result: IndicatorResult) => {

                // initialize dataset
                const resultConfig = listing.results.find(x => x.dataName == result.dataName);
                const dataset = this.cfg.baseDataset(result, resultConfig);
                const dataPoints: ScatterDataPoint[] = [];
                const pointColor: string[] = [];
                const pointRotation: number[] = [];

                // populate data
                data.forEach(row => {

                  let yValue = row[result.dataName];

                  // apply candle pointers
                  if (yValue && listing.category == "candlestick-pattern") {

                    switch (row["match"]) {

                      case -100:
                        yValue = 1.01 * row["candle"].high;
                        pointColor.push(red);
                        pointRotation.push(180);
                        break;

                      case 100:
                        yValue = 0.99 * row["candle"].low;
                        pointColor.push(green);
                        pointRotation.push(0);
                        break;

                      default:
                        yValue = 0.99 * row["candle"].low;
                        pointColor.push(gray);
                        pointRotation.push(0);
                        break;
                    }
                  }

                  else {
                    pointColor.push(resultConfig.defaultColor);
                    pointRotation.push(0);
                  }

                  dataPoints.push({
                    x: new Date(row.date).valueOf(),
                    y: yValue
                  });
                });

                // add extra bars
                const nextDate = new Date(Math.max.apply(null, dataPoints.map(h => new Date(h.x))));

                for (let i = 1; i < this.extraBars; i++) {
                  nextDate.setDate(nextDate.getDate() + 1);
                  dataPoints.push({
                    x: new Date(nextDate).valueOf(),
                    y: null
                  });
                }

                // custom candlestick pattern points
                if (listing.category == "candlestick-pattern" && dataset.type != 'bar') {
                  dataset.pointRotation = pointRotation;
                  dataset.pointBackgroundColor = pointColor;
                  dataset.pointBorderColor = pointColor;
                }

                dataset.data = dataPoints;
                result.dataset = dataset;
              });

            // replace tokens with values
            selection = this.selectionTokenReplacement(selection);

            // add to chart
            this.displaySelection(selection, listing, false);

            // inform caller
            observer.next();
          },
          error: (e: HttpErrorResponse) => {
            console.log(e);
            observer.error(e);
          }
        });
    });

    return obs;
  }

  addSelectionWithoutScroll(
    selection: IndicatorSelection
  ) {

    // TODO: reuse addSelectionPicked to avoid duplicate code
    // TODO: add use of dataset.parsing for y-axis (conditionally, also mentioned above)

    const green = "#2E7D32";
    const red = "#DD2C00";
    const gray = "#9E9E9E";

    // lookup config data
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    this.api.getSelectionData(selection, listing)
      .subscribe({
        next: (apidata: any[]) => {

          // compose datasets
          // parse each dataset
          selection.results
            .forEach((result: IndicatorResult) => {

              // initialize dataset
              const resultConfig = listing.results.find(x => x.dataName == result.dataName);
              const dataset = this.cfg.baseDataset(result, resultConfig);
              const data: ScatterDataPoint[] = [];
              const pointColor: string[] = [];
              const pointRotation: number[] = [];

              // populate data
              apidata.forEach(row => {

                let yValue = row[result.dataName];

                // apply candle pointers
                if (yValue && listing.category == "candlestick-pattern") {

                  switch (row["match"]) {

                    case -100:
                      yValue = 1.01 * row["candle"].high;
                      pointColor.push(red);
                      pointRotation.push(180);
                      break;

                    case 100:
                      yValue = 0.99 * row["candle"].low;
                      pointColor.push(green);
                      pointRotation.push(0);
                      break;

                    default:
                      yValue = 0.99 * row["candle"].low;
                      pointColor.push(gray);
                      pointRotation.push(0);
                      break;
                  }
                }

                else {
                  pointColor.push(resultConfig.defaultColor);
                  pointRotation.push(0);
                }

                data.push({
                  x: new Date(row.date).valueOf(),
                  y: yValue
                });
              });

              // add extra bars
              const nextDate = new Date(Math.max.apply(null, data.map(h => new Date(h.x))));

              for (let i = 1; i < this.extraBars; i++) {
                nextDate.setDate(nextDate.getDate() + 1);
                data.push({
                  x: new Date(nextDate).valueOf(),
                  y: null
                });
              }

              // custom candlestick pattern points
              if (listing.category == "candlestick-pattern" && dataset.type != 'bar') {
                dataset.pointRotation = pointRotation;
                dataset.pointBackgroundColor = pointColor;
                dataset.pointBorderColor = pointColor;
              }

              dataset.data = data;
              result.dataset = dataset;
            });

          // replace tokens with values
          selection = this.selectionTokenReplacement(selection);

          // add to chart
          this.displaySelection(selection, listing, false);
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
  //#endregion

  //#region CHARTS CHANGE
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

    // default configuration
    const chartConfig = this.cfg.baseOscillatorConfig();

    // add thresholds (reference lines)
    const qtyThresholds = listing.chartConfig?.thresholds?.length;

    // TODO: change these to line annotations; randomly using results[0] as basis
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
        yAxisID: 'y',
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
    chartConfig.options.scales.y.suggestedMin = listing.chartConfig?.minimumYAxis;
    chartConfig.options.scales.y.suggestedMax = listing.chartConfig?.maximumYAxis;

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

    // annotations (after scales are drawn)
    selection.chart.options.plugins.annotation.annotations
      = this.oscillatorAnnotation(selection);

    // apply changes
    selection.chart.update();
    if (scrollToMe) this.scrollToEnd(container.id);
  }

  updateOverlayAnnotations() {

    const xPos: ScaleValue = this.chartOverlay.scales["x"].min;
    const yPos: ScaleValue = this.chartOverlay.scales["y"].max;
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

  oscillatorAnnotation(selection: IndicatorSelection) {

    const labelFontColor = this.usr.settings.isDarkTheme ? '#757575' : '#121316';

    const xPos: ScaleValue = selection.chart.scales["x"].min;
    const yPos: ScaleValue = selection.chart.scales["y"].max;

    const annotation = this.commonAnnotation(selection.label, labelFontColor, xPos, yPos, 0, 1);
    return { annotation };
  }

  commonAnnotation(
    label: string,
    fontColor: string,
    xPos: ScaleValue,
    yPos: ScaleValue,
    xAdj: number = 0,
    yAdj: number = 0
  ): AnnotationOptions {

    const labelFillColor = this.usr.settings.isDarkTheme ? '#12131680' : '#FAF9FD90';

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
      backgroundColor: labelFillColor,
      padding: 0,
      position: 'start',
      xScaleID: 'x',
      yScaleID: 'y',
      xValue: xPos,
      yValue: yPos,
      xAdjust: xAdj,
      yAdjust: yAdj
    };

    return annotation;
  }

   onSettingsChange() {

    // FIX: does not reset y-axis label background color
    // `selection` may not hold master chart reference?!

    // strategically update chart theme
    // without destroying and re-creating charts

    // update overlay chart
    if (this.chartOverlay) {

      // remember dynamic options to restore
      const volumeAxisSize = this.chartOverlay.scales.volumeAxis.max;

      // replace chart options (has new theme)
      const options = this.cfg.baseOverlayOptions(volumeAxisSize);
      this.chartOverlay.options = options;

      // regenerate annotations
      this.chartOverlay.update('none');  // redraws scales
      this.updateOverlayAnnotations();

      // apply changes (final)
      this.chartOverlay.update('none');
    }

    // update oscillator charts
    this.selections
      .filter(x => x.chartType == "oscillator" && x.chart)
      .forEach((selection: IndicatorSelection) => {

        // replace chart options (has new theme)
        selection.chart.options = this.cfg.baseOscillatorOptions();

        // regenerate annotations
        selection.chart.update('none'); // redraws scales
        selection.chart.options.plugins.annotation.annotations
          = this.oscillatorAnnotation(selection);  // FIX: does not reset background color

        // apply changes
        selection.chart.update('none');
      });
  }
  //#endregion

  //#region DATA OPERATIONS
  loadCharts() {

    // base overlay chart with quotes
    this.api.getQuotes()
      .subscribe({
        next: (quotes: Quote[]) => {

          // load base overlay chart
          this.loadOverlayChart(quotes);

          // add/load indicators
          this.api.getListings()
            .subscribe({

              // load catalog
              next: (listings: IndicatorListing[]) => {

                // cache catalog
                this.listings = listings;

                // load indicators
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

    for (let i = 1; i < this.extraBars; i++) {
      nextDate.setDate(nextDate.getDate() + 1);

      // intentionally excluding price (gap covered by volume)
      volume.push({
        x: new Date(nextDate).valueOf(),
        y: null
      });
    }

    // define base datasets
    const chartData: ChartData = {
      datasets: [
        {
          type: 'candlestick',
          label: 'Price',
          data: price,
          yAxisID: 'y',
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

    // volume axis size
    const volumeAxisSize = 20 * (sumVol / volume.length) || 0;

    // default overlay chart configuration
    const chartConfig = this.cfg.baseOverlayConfig(volumeAxisSize);

    // add chart data
    chartConfig.data = chartData;

    // compose chart
    if (this.chartOverlay) this.chartOverlay.destroy();
    const myCanvas = document.getElementById("chartOverlay") as HTMLCanvasElement;
    this.chartOverlay = new Chart(myCanvas.getContext('2d'), chartConfig);
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
  //#endregion

  //#region UTILITIES

  selectionTokenReplacement(selection: IndicatorSelection): IndicatorSelection {

    selection.params.forEach((param, index) => {

      selection.label = selection.label.replace(`[P${index + 1}]`, param.value.toString());

      selection.results.forEach(r => {
        r.label = r.label.replace(`[P${index + 1}]`, param.value.toString());
      });
    });
    return selection;
  }

  getGuid(prefix: string = "chart"): string {
    return `${prefix}${Guid()}`;
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
  //#endregion
}
