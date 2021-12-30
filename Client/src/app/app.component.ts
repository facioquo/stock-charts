import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';

import { faGithub } from '@fortawesome/free-brands-svg-icons';

import Chart from 'chart.js/auto';  // import all default options
import { ChartDataset, FinancialDataPoint, ScatterDataPoint } from 'chart.js';
import { AnnotationOptions, ScaleValue } from 'chartjs-plugin-annotation';
import { ChartService } from './chart/chart.service';

import {
  Quote, IndicatorListing, IndicatorSelection, IndicatorResult, IndicatorParam, ChartThreshold
} from './app.models';
import { Guid } from "guid-typescript";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('chartsTop') chartRef: ElementRef;
  chartOverlay: Chart;

  faGithub = faGithub;
  loading = true;

  quotes: Quote[] = [];
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
          color: "darkRed"
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
      label: "RSI(14)",
      params: [
        { queryString: "lookbackPeriods=14" } as IndicatorParam
      ],
      results: [
        {
          label: "RSI(14)",
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

  ngOnInit() {
    this.startup();
  }

  // DATA OPERATIONS

  startup() {

    // fetch base quote
    this.http.get(`${env.api}/history`, this.requestHeader())
      .subscribe({
        next: (q: Quote[]) => {
          this.quotes = q;
          this.loadOverlayChart();
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });

    // fetch indicator list
    this.http.get(`${env.api}/indicators`, this.requestHeader())
      .subscribe({
        next: (list: IndicatorListing[]) => {
          this.listings = list;
          this.loadSelections();
        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });
  }

  // CHARTS OPERATIONS

  loadOverlayChart() {

    const chartConfig = this.cs.baseOverlayConfig();

    const price: FinancialDataPoint[] = [];
    const volume: ScatterDataPoint[] = [];
    let sumVol = 0;

    this.quotes.forEach((q: Quote) => {
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

    // define base datasets
    chartConfig.data = {
      datasets: [
        {
          type: 'candlestick',
          label: 'Price',
          data: price,
          yAxisID: 'yAxis',
          borderColor: '#616161',
          order: 1
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

    // scan indicator selections
    this.selections.forEach((selection: IndicatorSelection) => {

      // lookup config data
      const c = this.listings.find(x => x.uiid == selection.uiid);

      // compose url
      let url = `${c.endpoint}?`;
      selection.params.forEach((param: IndicatorParam, param_index: number) => {
        if (param_index != 0) url += "&";
        url += `${param.queryString}`;
      });

      // fetch data
      this.http.get(url, this.requestHeader())
        .subscribe({

          next: (apidata: any[]) => {

            // parse each datasets
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

            // add needed charts
            if (c.chartType != 'overlay') {

              const chartConfig = this.cs.baseOscillatorConfig();
              const listing = this.listings.find(x => x.uiid == selection.uiid);

              // initialize chart datasets
              chartConfig.data = {
                datasets: []
              };

              // chart configurations

              // add thresholds (reference lines)
              console.log("thresholds", listing.chartConfig?.thresholds);

              listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold) => {

                const lineData: ScatterDataPoint[] = [];

                console.log("result0", selection.results[0]);

                // compose threshold datas
                console.log("data", selection.results[0].data);
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

                console.log("threshold", thresholdDataset);
                chartConfig.data.datasets.push(thresholdDataset);
              });

              // hide thresholds from tooltips
              chartConfig.options.plugins.tooltip.filter = (tooltipItem) =>
                (tooltipItem.datasetIndex > chartConfig.data.datasets.length - 1);

              // y-scale
              chartConfig.options.scales.yAxis.min = listing.chartConfig?.minimumYAxis;
              chartConfig.options.scales.yAxis.max = listing.chartConfig?.maximumYAxis;

              // add indicator data
              selection.results.forEach(r => {

                const resultConfig = listing.results.find(x => x.dataName == r.dataName);

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
                    console.log("line", lineDataset);
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
                    console.log("line", barDataset);
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
            };
          },

          error: (e: HttpErrorResponse) => { console.log(e); }
        });

      console.log("loading", selection.label, selection.results);
    });
  }



  // GENERAL OPERATIONS

  updateOverlayAnnotations() {

    const xPos: ScaleValue = new Date(this.quotes[0].date).valueOf();
    const yPos: ScaleValue = this.cs.overlayYticks[this.cs.overlayYticks.length - 1].value;
    let adjY: number = 2;

    // this.chartOverlay.options.plugins.annotation.annotations =
    //   this.legend
    //     .filter(x => x.chart == 'overlay')
    //     .map((l, index) => {
    //       let annotation: AnnotationOptions = this.cs.commonAnnotation(l.label, l.color, xPos, yPos, -3, adjY);
    //       annotation.id = "note" + (index + 1).toString();
    //       adjY += 12;
    //       return annotation;
    //     });
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
      this.chartRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
    }, 200);
  }
}
