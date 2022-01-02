import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import Chart from 'chart.js/auto';  // import all default options
import { ChartDataset, FinancialDataPoint, ScatterDataPoint } from 'chart.js';
import { AnnotationOptions, ScaleValue } from 'chartjs-plugin-annotation';

import { ApiService } from './api.service';
import { ChartService } from './chart.service';
import {
  Quote,
  IndicatorListing,
  ChartThreshold,
  IndicatorSelection,
  IndicatorResult
} from './chart.models';

import { PickListComponent } from './picker/pick-list.component';

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

  loading = true;
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

          this.loadMainChart(q);

          // load default selections
          this.api.getListings()
            .subscribe({
              next: (listings: IndicatorListing[]) => {
                this.cs.listings = listings;
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
          backgroundColor: barColor,
          borderWidth: 0,
          order: 95
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

    const selectDefault2 = this.cs.defaultIndicatorSelection("EMA");
    const selectFinal2 = this.cs.selectionTokenReplacment(selectDefault2);
    this.addSelection(selectFinal2);

    const selectDefault3 = this.cs.defaultIndicatorSelection("PSAR");
    const selectFinal3 = this.cs.selectionTokenReplacment(selectDefault3);
    this.addSelection(selectFinal3);

    const selectDefault4 = this.cs.defaultIndicatorSelection("STO");
    const selectFinal4 = this.cs.selectionTokenReplacment(selectDefault4);
    this.addSelection(selectFinal4);

    const selectDefault5 = this.cs.defaultIndicatorSelection("RSI");
    selectDefault5.params.find(x => x.name == "lookbackPeriods").value = 5;
    const selectFinal5 = this.cs.selectionTokenReplacment(selectDefault5);
    this.addSelection(selectFinal5);

    // const defaultSelections: IndicatorSelection[] = [
    //   {
    //     ucid: this.cs.getChartGuid(),
    //     uiid: "EMA",
    //     label: "EMA(5)",
    //     params: [
    //       { name: "lookbackPeriods", value: 5 } as IndicatorParam
    //     ],
    //     results: [
    //       {
    //         label: "EMA(5)",
    //         dataName: "ema",
    //         color: "#EC407A"
    //       } as IndicatorResult
    //     ]
    //   } as IndicatorSelection,
    //   {
    //     ucid: this.cs.getChartGuid(),
    //     uiid: "EMA",
    //     label: "EMA(20)",
    //     params: [
    //       { name: "lookbackPeriods", value: 20 } as IndicatorParam
    //     ],
    //     results: [
    //       {
    //         label: "EMA(20)",
    //         dataName: "ema",
    //         color: "#1565C0"
    //       } as IndicatorResult
    //     ]
    //   } as IndicatorSelection,
    //   {
    //     ucid: this.cs.getChartGuid(),
    //     uiid: "RSI",
    //     label: "RSI(5)",
    //     params: [
    //       { name: "lookbackPeriods", value: 5 } as IndicatorParam
    //     ],
    //     results: [
    //       {
    //         label: "RSI(5)",
    //         dataName: "rsi",
    //         color: "#EF6C00"
    //       } as IndicatorResult
    //     ]
    //   } as IndicatorSelection];

    // // add indicator selections
    // defaultSelections.forEach((selection: IndicatorSelection) => {
    //   this.addSelection(selection);
    // });
  }


  // SELECTION OPERATIONS
  openPickList(): void {
    this.bs.open(PickListComponent, { data: this.cs.listings });
  }

  addSelection(selection: IndicatorSelection) {

    this.selections.push(selection);
    // TODO: save to cache

    // lookup config data
    const listing = this.cs.listings.find(x => x.uiid == selection.uiid);

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
    const listing = this.cs.listings.find(x => x.uiid == selection.uiid);

    // TODO: store full dataset in IndicatorResult so we can splice it from the Chart dataset
    // const rsiDataset = this.chartRsi.data.datasets.indexOf(line, 0);  // keep thi
    // this.chartRsi.data.datasets.splice(rsiDataset, 1);
    // handle mixed types (maybe listing="mixed", then use result subtype)
    // non-Overlay:
    //selection.chart.destroy()

    // remove from selections

  }


  // CHARTS OPERATIONS
  addOverlaySelectionToChart(selection: IndicatorSelection, listing: IndicatorListing) {

    // add indicator data
    selection.results.forEach((r: IndicatorResult, index: number) => {

      const resultConfig = listing.results.find(x => x.dataName == r.dataName);

      // TODO: this may be redundant, exept for default selections?  picker adds this already.
      r.chartType = (resultConfig.altChartType == null) ? listing.chartType : resultConfig.altChartType;
      // TODO: handle mixed type

      const dataset = this.cs.configDataset(resultConfig.lineType, r, index);
      this.chartOverlay.data.datasets.push(dataset);
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
    const qtyThresholds = listing.chartConfig.thresholds.length;

    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {

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
        pointRadius: 0,
        borderWidth: 2.5,
        borderDash: threshold.style == "dash" ? [5, 2] : [],
        borderColor: threshold.color,
        backgroundColor: threshold.color,
        spanGaps: true,
        fill: {
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

    // add indicator data
    selection.results.forEach((r: IndicatorResult, index: number) => {

      const resultConfig = listing.results.find(x => x.dataName == r.dataName);
      r.chartType = (resultConfig.altChartType == null) ? listing.chartType : resultConfig.altChartType;
      // TODO: handle mixed type

      const dataset = this.cs.configDataset(resultConfig.lineType, r, index);
      chartConfig.data.datasets.push(dataset);
    });

    // compose chart
    const myCanvas = document.createElement('canvas') as HTMLCanvasElement;
    myCanvas.id = selection.ucid;

    const body = document.getElementById("main-content");
    body.appendChild(myCanvas);

    if (selection.chart) selection.chart.destroy();
    selection.chart = new Chart(myCanvas.getContext("2d"), chartConfig);

    // annotations
    const xPos: ScaleValue = selection.chart.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = selection.chart.scales["yAxis"].getMinMax(false).max;

    const annotation: AnnotationOptions =
      this.cs.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, 0, 0);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();
  }

  updateOverlayAnnotations() {

    const xPos: ScaleValue = this.chartOverlay.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = this.chartOverlay.scales["yAxis"].getMinMax(false).max;
    let adjY: number = 0;

    this.chartOverlay.options.plugins.annotation.annotations =
      this.selections
        .filter(x => x.results[0].chartType == 'overlay')
        .map((selection: IndicatorSelection, index: number) => {
          const annotation: AnnotationOptions =
            this.cs.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, 0, adjY);
          annotation.id = "note" + (index + 1).toString();
          adjY += 12;
          return annotation;
        });

    const myCanvas = document.getElementById('chartOverlay') as HTMLCanvasElement;
    const ctx = myCanvas.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillText("Hello", 0, 0);

    this.chartOverlay.update();
  }


  // DATA OPERATIONS
  updateData() {

    // update selections data
    this.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const listing = this.cs.listings.find(x => x.uiid == selection.uiid);

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

          // TODO: refactor redundant code (see load)
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


  // HELPERS
  scrollToChartTop() {
    setTimeout(() => {
      this.chartTopRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }
}
