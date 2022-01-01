import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { Guid } from "guid-typescript";

import Chart from 'chart.js/auto';  // import all default options
import { ChartDataset, FinancialDataPoint, ScatterDataPoint } from 'chart.js';
import { AnnotationOptions, ScaleValue } from 'chartjs-plugin-annotation';

import { ChartService } from './chart.service';
import { IndicatorSelection, IndicatorParam, IndicatorResult } from './chart.models';

import { ApiService } from './api.service';
import { Quote, IndicatorListing, ChartThreshold } from './api.models';
import { ListSheetComponent } from './listing/listing.component';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  constructor(
    private readonly cs: ChartService,
    private readonly api: ApiService,
    private readonly bs: MatBottomSheet
  ) { }

  @ViewChild('chartsTop') chartTopRef: ElementRef;
  chartOverlay: Chart;
  quotes: Quote[];

  loading = true;
  listings: IndicatorListing[];
  selections: IndicatorSelection[] = [];

  // STARTUP OPERATIONS

  ngOnInit() {
    this.startup();
  }

  startup() {

    // compose main chart
    this.api.getQuotes()
      .subscribe({
        next: (q: Quote[]) => {
          this.quotes = q;
          this.loadMainChart(q);

          // load default selections
          this.api.getListings()
            .subscribe({
              next: (listings: IndicatorListing[]) => {
                this.listings = listings;
                this.loadSelections()
              },
              error: (e: HttpErrorResponse) => { console.log(e); }
            });
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  loadMainChart(quotes: Quote[]) {

    const chartConfig = this.cs.baseOverlayConfig();

    const price: FinancialDataPoint[] = [];
    const volume: ScatterDataPoint[] = [];
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
    });

    // custom border colors
    const candleOptions = Chart.defaults.elements["candlestick"];

    candleOptions.color.up = '#2c7433';
    candleOptions.color.down = 'darkRed';
    candleOptions.color.unchanged = '#616161';

    candleOptions.borderColor = {
      up: candleOptions.color.up,
      down: candleOptions.color.down,
      unchanged: candleOptions.color.unchanged
    };

    // define base datasets
    chartConfig.data = {
      datasets: [
        {
          type: 'candlestick',
          label: 'Price',
          data: price,
          yAxisID: 'yAxis',
          borderColor: candleOptions.borderColor,
          order: 90
        },
        {
          type: 'bar',
          label: 'Volume',
          data: volume,
          yAxisID: 'volumeAxis',
          backgroundColor: '#424242',
          borderWidth: 0,
          order: 99
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
    this.loading = false;
  }

  loadSelections() {

    // TODO: get from cache or use defaults if none

    const defaultSelections: IndicatorSelection[] = [
      {
        ucid: this.getChartGuid(),
        uiid: "EMA",
        label: "EMA(5)",
        params: [
          { name: "lookbackPeriods", value: 5 } as IndicatorParam
        ],
        results: [
          {
            label: "EMA(5)",
            dataName: "ema",
            color: "red"
          } as IndicatorResult
        ]
      } as IndicatorSelection,
      {
        ucid: this.getChartGuid(),
        uiid: "EMA",
        label: "EMA(20)",
        params: [
          { name: "lookbackPeriods", value: 20 } as IndicatorParam
        ],
        results: [
          {
            label: "EMA(20)",
            dataName: "ema",
            color: "darkOrange"
          } as IndicatorResult
        ]
      } as IndicatorSelection,
      {
        ucid: this.getChartGuid(),
        uiid: "RSI",
        label: "RSI(5)",
        params: [
          { name: "lookbackPeriods", value: 5 } as IndicatorParam
        ],
        results: [
          {
            label: "RSI(5)",
            dataName: "rsi",
            color: "darkOrange"
          } as IndicatorResult
        ]
      } as IndicatorSelection];

    // add indicator selections
    defaultSelections.forEach((selection: IndicatorSelection) => {
      this.addSelection(selection);
    });
  }


  // SELECTION OPERATIONS
  openBottomSheet(): void {
    this.bs.open(ListSheetComponent, { data: this.listings });
  }

  addSelection(selection: IndicatorSelection) {

    this.selections.push(selection);
    // TODO: save to cache

    // lookup config data
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    this.api.getSelectionData(selection, listing)
      .subscribe({
        next: () => {

          // add needed charts
          if (listing.chartType == 'overlay') {
            this.addOverlaySelectionToChart(selection, listing);
          }
          else {
            this.addNonOverlaySelectionChart(selection, listing);
          };

        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  deleteSelection(ucid: string) {

    const selection = this.selections.find(x => x.ucid == ucid);
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    // TODO: store full dataset in IndicatorResult so we can splice it from the Chart dataset
    // const rsiDataset = this.chartRsi.data.datasets.indexOf(line, 0);  // keep thi
    // this.chartRsi.data.datasets.splice(rsiDataset, 1);
    // handle mixed types (maybe listing="mixed", then use result subtype)
    // non-Overlay:
    //selection.chart.destroy()

    // remove from selections

  }

  getChartGuid(): string {
    return `chart${Guid.create().toString().replace(/-/gi, "")}`;
  }


  // CHARTS OPERATIONS
  addOverlaySelectionToChart(selection: IndicatorSelection, listing: IndicatorListing) {

    // add indicator data
    selection.results.forEach(r => {

      const resultConfig = listing.results.find(x => x.dataName == r.dataName);
      r.type = (resultConfig.altChartType == null) ? listing.chartType : resultConfig.altChartType;
      // TODO: handle mixed type

      switch (resultConfig.lineType) {

        case 'line':
          const lineDataset: ChartDataset = {
            label: r.label,
            type: 'line',
            data: r.data,
            yAxisID: 'yAxis',
            borderWidth: 1.5,
            borderColor: r.color,
            backgroundColor: r.color,
            pointRadius: 0,
            spanGaps: true,
            fill: false,
            order: 1
          };
          this.chartOverlay.data.datasets.push(lineDataset);
          break;

        case 'bar':
          const barDataset: ChartDataset = {
            label: r.label,
            type: 'bar',
            data: r.data,
            yAxisID: 'yAxis',
            borderWidth: 0,
            borderColor: r.color,
            backgroundColor: r.color,
            order: 1
          };
          this.chartOverlay.data.datasets.push(barDataset);
          break;
      };

      this.updateOverlayAnnotations();
    });
  }

  addNonOverlaySelectionChart(selection: IndicatorSelection, listing: IndicatorListing) {
    const chartConfig = this.cs.baseOscillatorConfig();

    // initialize chart datasets
    chartConfig.data = {
      datasets: []
    };

    // chart configurations

    // add thresholds (reference lines)
    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold) => {

      const lineData: ScatterDataPoint[] = [];

      // compose threshold data
      selection.results[0].data.forEach((d: ScatterDataPoint) => {
        lineData.push({ x: d.x, y: threshold.value } as ScatterDataPoint);
      });

      const thresholdDataset: ChartDataset = {
        label: "threshold",
        type: 'line',
        data: lineData,
        yAxisID: 'yAxis',
        borderWidth: 1,
        borderColor: threshold.color,
        backgroundColor: threshold.color,
        borderDash: threshold.style == "dotted" ? [5, 2] : [],
        pointRadius: 0,
        spanGaps: true,
        fill: false,
        order: 99
      };

      chartConfig.data.datasets.push(thresholdDataset);
    });

    // hide thresholds from tooltips
    const qtyThresholds = chartConfig.data.datasets
      .filter(x => x.label == "threshold").length;

    chartConfig.options.plugins.tooltip.filter = (tooltipItem) =>
      (tooltipItem.datasetIndex > (qtyThresholds - 1));

    // y-scale
    chartConfig.options.scales.yAxis.min = listing.chartConfig?.minimumYAxis;
    chartConfig.options.scales.yAxis.max = listing.chartConfig?.maximumYAxis;

    // add indicator data
    selection.results.forEach(r => {

      const resultConfig = listing.results.find(x => x.dataName == r.dataName);
      r.type = (resultConfig.altChartType == null) ? listing.chartType : resultConfig.altChartType;
      // TODO: handle mixed type

      switch (resultConfig.lineType) {

        case 'line':
          const lineDataset: ChartDataset = {
            label: r.label,
            type: 'line',
            data: r.data,
            yAxisID: 'yAxis',
            borderWidth: 1.5,
            borderColor: r.color,
            backgroundColor: r.color,
            pointRadius: 0,
            spanGaps: true,
            fill: false,
            order: 1
          };
          chartConfig.data.datasets.push(lineDataset);
          break;

        case 'bar':
          const barDataset: ChartDataset = {
            label: r.label,
            type: 'bar',
            data: r.data,
            yAxisID: 'yAxis',
            borderWidth: 0,
            borderColor: r.color,
            backgroundColor: r.color,
            order: 1
          };
          chartConfig.data.datasets.push(barDataset);
          break;
      }
    });

    // compose chart
    const myCanvas = document.createElement('canvas') as HTMLCanvasElement;
    myCanvas.id = selection.ucid;

    const body = document.getElementsByTagName("body")[0];
    body.appendChild(myCanvas);

    if (selection.chart) selection.chart.destroy();
    selection.chart = new Chart(myCanvas.getContext('2d'), chartConfig);

    // annotations
    const xPos: ScaleValue = new Date(this.quotes[0].date).valueOf();
    const yPos: ScaleValue = this.cs.yAxisTicks[this.cs.yAxisTicks.length - 1].value;
    let adjY: number = 1;

    let annotation: AnnotationOptions =
      this.cs.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, 2, adjY);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();
  }


  // DATA OPERATIONS
  updateData() {

    // update selections data
    this.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const listing = this.listings.find(x => x.uiid == selection.uiid);

      this.api.getSelectionData(selection, listing)
        .subscribe({
          next: () => {
            if (listing.chartType != 'overlay') {
              selection.chart.update();
            };
          },
          error: (e: HttpErrorResponse) => { console.log(e); }
        });
    });

    // update primary data
    this.api.getQuotes()
      .subscribe({
        next: (quotes: Quote[]) => {

          const price: FinancialDataPoint[] = [];
          const volume: ScatterDataPoint[] = [];
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

            // get size for volume axis
            const volumeAxisSize = 20 * (sumVol / volume.length) || 0;
            this.chartOverlay.options.scales.volumeAxis.max = volumeAxisSize;
            this.chartOverlay.update();
          });
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }


  // ANNOTATION OPERATIONS
  updateOverlayAnnotations() {

    const xPos: ScaleValue = new Date(this.quotes[0].date).valueOf();
    const yPos: ScaleValue = this.cs.yAxisTicks[this.cs.yAxisTicks.length - 1].value;
    let adjY: number = 1;

    this.chartOverlay.options.plugins.annotation.annotations =
      this.selections
        .filter(x => x.results[0].type == 'overlay')
        .map((l, index) => {
          let annotation: AnnotationOptions =
            this.cs.commonAnnotation(l.label, l.results[0].color, xPos, yPos, 0, adjY);
          annotation.id = "note" + (index + 1).toString();
          adjY += 12;
          return annotation;
        });

    this.chartOverlay.update();
  }


  // HELPERS
  scrollToChartTop() {
    setTimeout(() => {
      this.chartTopRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }
}
