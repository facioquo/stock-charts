import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';

import { Chart, ChartPoint, ChartDataSets } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  @ViewChild('chart', { static: true }) chartRef: ElementRef;
  chartConfig: Chart;

  history: Quote[] = [];
  indicators: ChartDataSets[] = [];

  // add indicator
  pickIndicator = false;
  pickedType: IndicatorType = undefined;
  pickedParams: IndicatorParameters;

  readonly indicatorTypes: IndicatorType[] = [
    { code: 'SMA', name: 'Simple Moving Average' },
    { code: 'EMA', name: 'Exponential Moving Average' }
  ];

  readonly colors: string[] = ['DeepPink', 'DarkRed', 'Orange', 'Green', 'Blue'];

  constructor(
    private readonly http: HttpClient
  ) { }


  ngOnInit() {
    this.cancelAdd();
    this.getHistory();
  }


  getHistory() {

    this.http.get(`${env.api}/history`, this.requestHeader())
      .subscribe((h: Quote[]) => {
        this.history = h;
        this.getChart();
      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  getChart() {

    const price: ChartPoint[] = [];
    const volume: ChartPoint[] = [];
    let sumVol = 0;

    this.history.forEach((q: Quote) => {
      price.push({ x: q.date, y: q.close });
      volume.push({ x: q.date, y: q.volume });
      sumVol += q.volume;
    });

    const volAxisSize = 15 * (sumVol / volume.length) || 0;

    const myChart: HTMLCanvasElement = this.chartRef.nativeElement as HTMLCanvasElement;

    this.chartConfig = new Chart(myChart.getContext('2d'), {
      type: 'bar',
      data: {
        datasets: [
          {
            type: 'line',
            label: 'Price',
            data: price,
            yAxisID: 'priceAxis',
            borderWidth: 2,
            borderColor: 'black',
            backgroundColor: 'black',
            pointRadius: 0,
            fill: false,
            spanGaps: false
          },
          {
            type: 'line',
            label: 'Volume',
            data: volume,
            yAxisID: 'volumeAxis',
            borderWidth: 2,
            borderColor: 'lightblue',
            backgroundColor: 'lightblue',
            pointRadius: 0,
            fill: true,
            spanGaps: true
          }

        ]
      },
      options: {

        title: {
          text: 'stock prices and indicators',
          fontFamily: 'Roboto',
          display: false
        },
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10
          }
        },
        legend: {
          display: false,
          position: 'bottom'
        },
        scales: {
          xAxes: [{
            display: true,
            type: 'time',
            time: {
              unit: 'month' as Chart.TimeUnit,
              displayFormats: {
                month: 'MMM`YY'
              }
            }
          }],
          yAxes: [
            {
              id: 'priceAxis',
              display: true,
              position: 'left',
              scaleLabel: {
                display: true,
                labelString: 'price'
              },
              ticks: {
                beginAtZero: false
              }
            },
            {
              id: 'volumeAxis',
              display: false,
              position: 'right',
              scaleLabel: {
                display: true,
                labelString: 'volume'
              },
              ticks: {
                beginAtZero: true,
                max: volAxisSize
              }
            }
          ],
        }
      }
    });

    this.addIndicatorEMA('EMA', 50, 'darkred');
    this.addIndicatorEMA('EMA', 200, 'green');
  }


  // EDIT INDICATORS

  cancelAdd() {

    this.pickIndicator = false;
    this.pickedType = { code: undefined, name: undefined };

    this.pickedParams = {
      parameterOne: undefined,
      parameterTwo: undefined,
      parameterThree: undefined,
      color: 'orange'
    };
  }

  addIndicator() {

    // simple moving average
    if (this.pickedType.code === 'SMA') {
      this.addIndicatorSMA(this.pickedType.code, this.pickedParams.parameterOne, this.pickedParams.color);
    }

    // simple moving average
    if (this.pickedType.code === 'EMA') {
      this.addIndicatorEMA(this.pickedType.code, this.pickedParams.parameterOne, this.pickedParams.color);
    }

    this.cancelAdd();
  }


  addIndicatorSMA(type: string, lookbackPeriod: number, color: string) {

    this.http.get(`${env.api}/${type}/${lookbackPeriod}`, this.requestHeader())
      .subscribe((sma: SmaResult[]) => {

        // componse data
        const newIndicator: ChartPoint[] = [];

        sma.forEach((m: SmaResult) => {
          newIndicator.push({ x: m.date, y: m.sma });
        });

        const label = `${type.toUpperCase()} (${lookbackPeriod})`;

        // compose configuration
        const newDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: newIndicator,
          borderWidth: 1,
          borderColor: color,
          pointRadius: 0,
          pointBackgroundColor: color,
          pointBorderColor: color,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartConfig.data.datasets.push(newDataset);
        this.chartConfig.update();

        // add to list
        this.indicators.push(newDataset);

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addIndicatorEMA(type: string, lookbackPeriod: number, color: string) {

    this.http.get(`${env.api}/${type}/${lookbackPeriod}`, this.requestHeader())
      .subscribe((ema: EmaResult[]) => {

        // componse data
        const newIndicator: ChartPoint[] = [];

        ema.forEach((m: EmaResult) => {
          newIndicator.push({ x: m.date, y: m.ema });
        });

        const label = `${type.toUpperCase()} (${lookbackPeriod})`;

        // compose configuration
        const newDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: newIndicator,
          borderWidth: 1,
          borderColor: color,
          pointRadius: 0,
          pointBackgroundColor: color,
          pointBorderColor: color,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartConfig.data.datasets.push(newDataset);
        this.chartConfig.update();

        // add to list
        this.indicators.push(newDataset);

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  deleteIndicator(indicator: Indicator) {

    // remove from chart
    const idxDataset = this.chartConfig.data.datasets.indexOf(indicator, 0);
    this.chartConfig.data.datasets.splice(idxDataset, 1);
    this.chartConfig.update();

    // remove from legend
    const idxLegend = this.indicators.indexOf(indicator, 0);
    this.indicators.splice(idxLegend, 1);
  }


  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }

}


export interface Quote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Indicator {
  label: string;
  color: string;
}

export interface SmaResult {
  date: Date;
  sma: number;
}

export interface EmaResult {
  date: Date;
  ema: number;
}

export interface IndicatorType {
  code: string;
  name: string;
}

export interface IndicatorParameters {
  parameterOne: number;
  parameterTwo: number;
  parameterThree: number;
  color: string;
}
