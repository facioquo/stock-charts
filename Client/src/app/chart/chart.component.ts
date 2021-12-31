import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../../environments/environment';

import Chart from 'chart.js/auto';  // import all default options
import { ChartDataset, FinancialDataPoint, ScatterDataPoint } from 'chart.js';
import { AnnotationOptions, ScaleValue } from 'chartjs-plugin-annotation';
import { ChartService } from './chart.service';

import {
  Quote, IndicatorListing, IndicatorSelection, IndicatorResult, IndicatorParam, ChartThreshold
} from './chart.models';
import { Guid } from "guid-typescript";
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss']
})
export class ChartComponent implements OnInit {

  @ViewChild('chartsTop') chartTopRef: ElementRef;
  chartOverlay: Chart;

  loading = true;
  listings: IndicatorListing[];

  // seed charts (values from wizard, normally)
  selections: IndicatorSelection[] = [
    {
      ucid: `chart${Guid.create().toString().replace(/-/gi, "")}`,
      uiid: "EMA",
      label: "EMA(5)",
      params: [
        { queryString: "lookbackPeriods=5" } as IndicatorParam
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
      ucid: `chart${Guid.create().toString().replace(/-/gi, "")}`,
      uiid: "EMA",
      label: "EMA(20)",
      params: [
        { queryString: "lookbackPeriods=20" } as IndicatorParam
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
      ucid: `chart${Guid.create().toString().replace(/-/gi, "")}`,
      uiid: "RSI",
      label: "RSI(5)",
      params: [
        { queryString: "lookbackPeriods=5" } as IndicatorParam
      ],
      results: [
        {
          label: "RSI(5)",
          dataName: "rsi",
          color: "darkOrange"
        } as IndicatorResult
      ]
    } as IndicatorSelection
  ];

  constructor(
    private readonly http: HttpClient,
    private readonly cs: ChartService
  ) { }

  // STARTUP OPERATIONS

  ngOnInit() {
    this.startup();
  }

  startup() {

    // compose main chart
    this.http.get(`${env.api}/quotes`, this.requestHeader())
      .subscribe({
        next: (q: Quote[]) => {
          this.loadMainChart(q);

          // load default selections
          this.http.get(`${env.api}/indicators`, this.requestHeader())
            .subscribe({
              next: (listings: IndicatorListing[]) => {
                this.listings = listings;
                this.loadSelections(listings, q)
              },
              error: (e: HttpErrorResponse) => { console.log(e); }
            });
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  // API OPERATIONS
  updateData() {

    // update selections data
    this.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const listing = this.listings.find(x => x.uiid == selection.uiid);

      this.getSelectionData(selection, listing)
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
    this.http.get(`${env.api}/quotes`, this.requestHeader())
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

  // CHARTS OPERATIONS

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

  loadSelections(listings: IndicatorListing[], quotes: Quote[]) {

    // scan indicator selections
    this.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const listing = listings.find(x => x.uiid == selection.uiid);

      this.getSelectionData(selection, listing)
        .subscribe({
          next: () => {

            // add needed charts
            if (listing.chartType == 'overlay') {
              this.addOverlaySelectionToChart(selection, listing, quotes);
            }
            else {
              this.addNonOverlaySelectionChart(selection, listing, quotes);
            };

          },
          error: (e: HttpErrorResponse) => { console.log(e); }
        });
    });
  }

  getSelectionData(selection: IndicatorSelection, listing: IndicatorListing): Observable<any> {

    const obs = new Observable((observer) => {

      // compose url
      let url = `${listing.endpoint}?`;
      selection.params.forEach((param: IndicatorParam, param_index: number) => {
        if (param_index != 0) url += "&";
        url += `${param.queryString}`;
      });

      // fetch data
      this.http.get(url, this.requestHeader())
        .subscribe({

          next: (apidata: any[]) => {

            // parse each dataset
            selection.results
              .forEach((result: IndicatorResult) => {

                // initialize dataset
                result.data = [];

                // populate data
                apidata.forEach(dt => {

                  result.data
                    .push({
                      x: new Date(dt.date).valueOf(),
                      y: dt[result.dataName]
                    });
                });
              });

            observer.next(selection.results);
          },

          error: (e: HttpErrorResponse) => { console.log(e); return null; }
        });

    });

    return obs;
  }

  addOverlaySelectionToChart(selection: IndicatorSelection, listing: IndicatorListing, quotes: Quote[]) {

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

      this.updateOverlayAnnotations(quotes);
    });
  }

  addNonOverlaySelectionChart(selection: IndicatorSelection, listing: IndicatorListing, quotes: Quote[]) {
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
    const xPos: ScaleValue = new Date(quotes[0].date).valueOf();
    const yPos: ScaleValue = this.cs.yAxisTicks[this.cs.yAxisTicks.length - 1].value;
    let adjY: number = 1;

    let annotation: AnnotationOptions =
      this.cs.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, 2, adjY);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();
  }

  // GENERAL OPERATIONS

  updateOverlayAnnotations(quotes: Quote[]) {

    const xPos: ScaleValue = new Date(quotes[0].date).valueOf();
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

  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }


  // HELPER FUNCTIONS

  toDecimals(value: number, decimalPlaces: number): number {
    if (value === null) return null;
    return value.toFixed(decimalPlaces) as unknown as number;
  }

  scrollToChartTop() {
    setTimeout(() => {
      this.chartTopRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }
}
