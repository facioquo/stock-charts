import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';
import { Chart, ChartPoint, ChartDataSets } from 'chart.js';

import {
  Quote,
  IndicatorType,
  IndicatorParameters,
  SmaResult,
  EmaResult,
  BollingerBandConfig,
  BollingerBandResult
} from './app.models';
import { MatRadioChange } from '@angular/material/radio';

export interface Indicator {
  label: string;
  color: string;
  lines: ChartDataSets[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('chart', { static: true }) chartRef: ElementRef;
  chartConfig: Chart;

  history: Quote[] = [];
  legend: Indicator[] = [];

  // add indicator
  pickIndicator = false;
  pickedType: IndicatorType = undefined;
  pickedParams: IndicatorParameters;

  readonly indicatorTypes: IndicatorType[] = [
    { code: 'SMA', name: 'Simple Moving Average' },
    { code: 'EMA', name: 'Exponential Moving Average' },
    { code: 'BB', name: 'Bollinger Bands' }
  ];

  readonly colors: string[] = ['DeepPink', 'DarkRed', 'Orange', 'Green', 'Blue'];
  readonly smNums: number[] = [3, 5, 10, 15, 25];
  readonly lgNums: number[] = [15, 30, 50, 100, 200];
  readonly bbConfigs: BollingerBandConfig[] = [
    { id: 1, label: 'BB (15,2)', lookbackPeriod: 15, standardDeviations: 2 },
    { id: 2, label: 'BB (20,2)', lookbackPeriod: 20, standardDeviations: 2 },
    { id: 3, label: 'BB (45,3)', lookbackPeriod: 45, standardDeviations: 3 }
  ];

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
                display: false,
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

    this.addIndicatorEMA('EMA', { parameterOne: 25, color: 'red' });
    this.addIndicatorEMA('EMA', { parameterOne: 150, color: 'darkGreen' });
  }


  // EDIT INDICATORS

  cancelAdd() {

    this.pickIndicator = false;
    this.pickedType = { code: undefined, name: undefined };

    this.pickedParams = {
      parameterOne: undefined,
      parameterTwo: undefined,
      parameterThree: undefined,
      color: undefined
    };
  }


  pickType(t: IndicatorType) {
    this.pickedType = t;

    if (this.pickedType.code === 'BB') this.pickedParams.color = 'darkGray';
  }

  addIndicator() {

    // simple moving average
    if (this.pickedType.code === 'SMA') {
      this.addIndicatorSMA(this.pickedType.code, this.pickedParams);
    }

    // simple moving average
    if (this.pickedType.code === 'EMA') {
      this.addIndicatorEMA(this.pickedType.code, this.pickedParams);
    }

    // simple moving average
    if (this.pickedType.code === 'BB') {
      this.addIndicatorBB(this.pickedParams);
    }


    this.cancelAdd();
  }


  addIndicatorSMA(type: string, params: IndicatorParameters) {

    this.http.get(`${env.api}/${type}/${params.parameterOne}`, this.requestHeader())
      .subscribe((sma: SmaResult[]) => {

        const label = `${type.toUpperCase()} (${params.parameterOne})`;

        // componse data
        const smaLine: ChartPoint[] = [];

        sma.forEach((m: SmaResult) => {
          smaLine.push({ x: m.date, y: m.sma });
        });

        // compose configuration
        const smaDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: smaLine,
          borderWidth: 1,
          borderColor: params.color,
          pointRadius: 0,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartConfig.data.datasets.push(smaDataset);
        this.chartConfig.update();

        // add to legend
        this.legend.push({ label: label, color: params.color, lines: [smaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addIndicatorEMA(type: string, params: IndicatorParameters) {

    this.http.get(`${env.api}/${type}/${params.parameterOne}`, this.requestHeader())
      .subscribe((ema: EmaResult[]) => {

        const label = `${type.toUpperCase()} (${params.parameterOne})`;

        // componse data
        const emaLine: ChartPoint[] = [];

        ema.forEach((m: EmaResult) => {
          emaLine.push({ x: m.date, y: m.ema });
        });

        // compose configuration
        const emaDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: emaLine,
          borderWidth: 1,
          borderColor: params.color,
          pointRadius: 0,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartConfig.data.datasets.push(emaDataset);
        this.chartConfig.update();

        // add to legend
        this.legend.push({ label: label, color: params.color, lines: [emaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  bbChange(event: MatRadioChange) {
    const bb: BollingerBandConfig = event.value;
    this.pickedParams.parameterOne = bb.lookbackPeriod;
    this.pickedParams.parameterTwo = bb.standardDeviations;
  }

  addIndicatorBB(params: IndicatorParameters) {

    // remove old to clear chart
    this.legend.filter(x => x.label.startsWith('BB')).forEach(x => {
      this.deleteIndicator(x);
    });

    // add new
    this.http.get(`${env.api}/BB/${params.parameterOne}/${params.parameterTwo}`, this.requestHeader())
      .subscribe((bb: BollingerBandResult[]) => {

        const label = `BB (${params.parameterOne},${params.parameterTwo})`;

        // componse data
        const smaLine: ChartPoint[] = [];
        const upperLine: ChartPoint[] = [];
        const lowerLine: ChartPoint[] = [];

        bb.forEach((m: BollingerBandResult) => {
          smaLine.push({ x: m.date, y: m.sma });
          upperLine.push({ x: m.date, y: m.upperBand });
          lowerLine.push({ x: m.date, y: m.lowerBand });
        });

        // compose configurations
        const smaDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: smaLine,
          borderWidth: 2,
          borderDash: [5, 2],
          borderColor: params.color,
          pointRadius: 0,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          spanGaps: false
        };

        const upperDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: upperLine,
          borderWidth: 1,
          borderDash: [5, 2],
          borderColor: params.color,
          pointRadius: 0,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          spanGaps: false
        };

        const lowerDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: lowerLine,
          borderWidth: 1,
          borderDash: [5, 2],
          borderColor: params.color,
          pointRadius: 0,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartConfig.data.datasets.push(smaDataset);
        this.chartConfig.data.datasets.push(upperDataset);
        this.chartConfig.data.datasets.push(lowerDataset);
        this.chartConfig.update();

        // add to legend
        this.legend.push({ label: label, color: params.color, lines: [smaDataset, upperDataset, lowerDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }






  // GENERAL OPERATIONS

  deleteIndicator(indicator: Indicator) {

    console.log(this.legend);

    const idxLegend = this.legend.indexOf(indicator, 0);

    // remove from chart (can be multiple lines per indicator)
    this.legend[idxLegend].lines.forEach(line => {
      const idxDataset = this.chartConfig.data.datasets.indexOf(line, 0);
      this.chartConfig.data.datasets.splice(idxDataset, 1);
    });
    this.chartConfig.update();

    // remove from legend
    this.legend.splice(idxLegend, 1);
  }


  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }

}
