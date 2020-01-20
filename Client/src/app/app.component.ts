import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';
import { Chart, ChartPoint, ChartDataSets } from 'chart.js';
import { MatRadioChange } from '@angular/material/radio';

import {
  Quote,
  IndicatorType,
  IndicatorParameters,

  // configs
  BollingerBandConfig,
  ParabolicSarConfig,
  RsiConfig,

  // results
  BollingerBandResult,
  EmaResult,
  ParabolicSarResult,
  RsiResult,
  SmaResult
} from './app.models';

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

  @ViewChild('chartOverlay', { static: true }) chartOverlayRef: ElementRef;
  chartOverlayConfig: Chart;
  legendOverlays: Indicator[] = [];

  oscillatorOn = true;
  @ViewChild('chartOscillator', { static: true }) chartOscillatorRef: ElementRef;
  chartOscillatorConfig: Chart;
  legendOscillators: Indicator[] = [];

  history: Quote[] = [];

  // add indicator
  pickIndicator = false;
  pickedType: IndicatorType = undefined;
  pickedParams: IndicatorParameters;

  readonly indicatorTypes: IndicatorType[] = [
    { code: 'BB', name: 'Bollinger Bands' },
    { code: 'EMA', name: 'Exponential Moving Average' },
    { code: 'PSAR', name: 'Parabolic SAR' },
    { code: 'SMA', name: 'Simple Moving Average' },
    { code: 'RSI', name: 'Relative Strength Index' }
  ];

  // indicator parameter values
  readonly colors: string[] = ['DeepPink', 'DarkRed', 'Orange', 'Green', 'Blue'];
  readonly smNums: number[] = [3, 5, 10, 15, 25];
  readonly lgNums: number[] = [15, 30, 50, 100, 200];

  readonly bbConfigs: BollingerBandConfig[] = [
    { label: 'BB (15,2)', lookbackPeriod: 15, standardDeviations: 2 },
    { label: 'BB (20,2)', lookbackPeriod: 20, standardDeviations: 2 },
    { label: 'BB (45,3)', lookbackPeriod: 45, standardDeviations: 3 }
  ];
  readonly psarConfigs: ParabolicSarConfig[] = [
    { label: 'PSAR (0.01,0.15)', accelerationStep: 0.01, maxAccelerationFactor: 0.15 },
    { label: 'PSAR (0.02,0.2)', accelerationStep: 0.02, maxAccelerationFactor: 0.2 },
    { label: 'PSAR (0.03,0.25)', accelerationStep: 0.03, maxAccelerationFactor: 0.25 }
  ];
  readonly rsiConfigs: RsiConfig[] = [
    { label: 'RSI (5)', lookbackPeriod: 5 },
    { label: 'RSI (14)', lookbackPeriod: 14 },
    { label: 'RSI (30)', lookbackPeriod: 30 }
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
        this.addBaseOverlayChart();
        this.addBaseOscillatorChart();
      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addBaseOverlayChart() {

    const price: ChartPoint[] = [];
    const volume: ChartPoint[] = [];
    let sumVol = 0;

    this.history.forEach((q: Quote) => {
      price.push({ x: q.date, y: q.close });
      volume.push({ x: q.date, y: q.volume });
      sumVol += q.volume;
    });

    const volAxisSize = 15 * (sumVol / volume.length) || 0;

    const myChart: HTMLCanvasElement = this.chartOverlayRef.nativeElement as HTMLCanvasElement;

    this.chartOverlayConfig = new Chart(myChart.getContext('2d'), {
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
            distribution: 'linear',
            time: {
              unit: 'month' as Chart.TimeUnit,
              displayFormats: {
                month: 'MMM'
              }
            }
          },
          {
            display: true,
            type: 'time',
            time: {
              unit: 'year' as Chart.TimeUnit,
              displayFormats: {
                year: 'YYYY'
              }
            },
            gridLines: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
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


  addBaseOscillatorChart() {

    const topThreshold: ChartPoint[] = [];
    const bottomThreshold: ChartPoint[] = [];

    this.history.forEach((q: Quote) => {
      topThreshold.push({ x: q.date, y: 70 });
      bottomThreshold.push({ x: q.date, y: 30 });
    });

    const myChart: HTMLCanvasElement = this.chartOscillatorRef.nativeElement as HTMLCanvasElement;

    this.chartOscillatorConfig = new Chart(myChart.getContext('2d'), {
      type: 'bar',
      data: {
        datasets: [
          {
            type: 'line',
            data: topThreshold,
            yAxisID: 'yAxis',
            borderWidth: 1,
            borderColor: 'darkRed',
            borderDash: [5, 2],
            pointRadius: 0,
            fill: false,
            spanGaps: false
          },
          {
            type: 'line',
            data: bottomThreshold,
            yAxisID: 'yAxis',
            borderWidth: 1,
            borderColor: 'darkGreen',
            borderDash: [5, 2],
            pointRadius: 0,
            fill: false,
            spanGaps: true
          }
        ]
      },
      options: {

        title: {
          text: 'oscillators',
          fontFamily: 'Roboto',
          display: false
        },
        responsive: true,
        maintainAspectRatio: false,
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
            distribution: 'linear',
            time: {
              unit: 'month' as Chart.TimeUnit,
              displayFormats: {
                month: 'MMM'
              }
            }
          },
          {
            display: true,
            type: 'time',
            time: {
              unit: 'year' as Chart.TimeUnit,
              displayFormats: {
                year: 'YYYY'
              }
            },
            gridLines: {
              drawOnChartArea: false, // only want the grid lines for one axis to show up
            }
          }],
          yAxes: [
            {
              id: 'yAxis',
              display: true,
              position: 'left',
              ticks: {
                beginAtZero: true,
                max: 100
              }
            }
          ],
        }
      }
    });

    this.oscillatorOn = false;
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
    if (this.pickedType.code === 'PSAR') this.pickedParams.color = 'purple';
    if (this.pickedType.code === 'RSI') this.pickedParams.color = 'black';
  }

  addIndicator() {

    // sorted alphabetically

    // bollinger bands
    if (this.pickedType.code === 'BB') {
      this.addIndicatorBB(this.pickedParams);
    }

    // simple moving average
    if (this.pickedType.code === 'EMA') {
      this.addIndicatorEMA(this.pickedType.code, this.pickedParams);
    }

    // parabolid sar
    if (this.pickedType.code === 'PSAR') {
      this.addIndicatorPSAR(this.pickedParams);
    }

    // relative strength indicator
    if (this.pickedType.code === 'RSI') {
      this.oscillatorOn = true;
      this.addIndicatorRSI(this.pickedParams);
    }

    // simple moving average
    if (this.pickedType.code === 'SMA') {
      this.addIndicatorSMA(this.pickedType.code, this.pickedParams);
    }

    this.cancelAdd();

    console.log('overlays', this.chartOverlayConfig.data.datasets);
    console.log('oscillators', this.chartOscillatorConfig.data.datasets);

  }


  // INDICATORS

  bbChange(event: MatRadioChange) {
    const bb: BollingerBandConfig = event.value;
    this.pickedParams.parameterOne = bb.lookbackPeriod;
    this.pickedParams.parameterTwo = bb.standardDeviations;
  }

  addIndicatorBB(params: IndicatorParameters) {

    // remove old to clear chart
    this.legendOverlays.filter(x => x.label.startsWith('BB')).forEach(x => {
      this.deleteOverlay(x);
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
        const upperDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: upperLine,
          borderWidth: 1,
          borderDash: [5, 2],
          borderColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        const smaDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: smaLine,
          borderWidth: 2,
          borderDash: [5, 2],
          borderColor: params.color,
          pointRadius: 0,
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
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlayConfig.data.datasets.push(upperDataset);
        this.chartOverlayConfig.data.datasets.push(smaDataset);
        this.chartOverlayConfig.data.datasets.push(lowerDataset);
        this.chartOverlayConfig.update();

        // add to legend
        this.legendOverlays.push({ label: label, color: params.color, lines: [smaDataset, upperDataset, lowerDataset] });

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
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlayConfig.data.datasets.push(emaDataset);
        this.chartOverlayConfig.update();

        // add to legend
        this.legendOverlays.push({ label: label, color: params.color, lines: [emaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  psarChange(event: MatRadioChange) {
    const psar: ParabolicSarConfig = event.value;
    this.pickedParams.parameterOne = psar.accelerationStep;
    this.pickedParams.parameterTwo = psar.maxAccelerationFactor;
  }

  addIndicatorPSAR(params: IndicatorParameters) {

    // remove old to clear chart
    this.legendOverlays.filter(x => x.label.startsWith('PSAR')).forEach(x => {
      this.deleteOverlay(x);
    });

    // add new
    this.http.get(`${env.api}/PSAR/${params.parameterOne}/${params.parameterTwo}`, this.requestHeader())
      .subscribe((psar: ParabolicSarResult[]) => {

        const label = `PSAR (${params.parameterOne},${params.parameterTwo})`;

        // componse data
        const sarLine: ChartPoint[] = [];

        psar.forEach((m: ParabolicSarResult) => {
          sarLine.push({ x: m.date, y: m.sar });
        });

        // compose configurations
        const sarDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: sarLine,
          pointRadius: 1,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          showLine: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlayConfig.data.datasets.push(sarDataset);
        this.chartOverlayConfig.update();

        // add to legend
        this.legendOverlays.push({ label: label, color: params.color, lines: [sarDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  rsiChange(event: MatRadioChange) {
    const rsi: RsiConfig = event.value;
    this.pickedParams.parameterOne = rsi.lookbackPeriod;
  }

  addIndicatorRSI(params: IndicatorParameters) {

    this.http.get(`${env.api}/RSI/${params.parameterOne}`, this.requestHeader())
      .subscribe((rsi: RsiResult[]) => {

        const label = `RSI (${params.parameterOne})`;

        // componse data
        const rsiLine: ChartPoint[] = [];

        rsi.forEach((m: RsiResult) => {
          rsiLine.push({ x: m.date, y: m.rsi });
        });

        // compose configuration
        const rsiDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: rsiLine,
          borderWidth: 1,
          borderColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOscillatorConfig.data.datasets.push(rsiDataset);
        this.chartOscillatorConfig.update();

        // add to legend
        this.legendOscillators.push({ label: label, color: params.color, lines: [rsiDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
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
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlayConfig.data.datasets.push(smaDataset);
        this.chartOverlayConfig.update();

        // add to legend
        this.legendOverlays.push({ label: label, color: params.color, lines: [smaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  // GENERAL OPERATIONS

  deleteOverlay(indicator: Indicator) {

    const idxLegend = this.legendOverlays.indexOf(indicator, 0);

    // remove from chart (can be multiple lines per indicator)
    this.legendOverlays[idxLegend].lines.forEach(line => {
      const overlayDataset = this.chartOverlayConfig.data.datasets.indexOf(line, 0);
      this.chartOverlayConfig.data.datasets.splice(overlayDataset, 1);
    });

    // update charts
    this.chartOverlayConfig.update();

    // remove from legend
    this.legendOverlays.splice(idxLegend, 1);
  }

  deleteOscillator(indicator: Indicator) {

    const idxLegend = this.legendOscillators.indexOf(indicator, 0);

    // remove from chart (can be multiple lines per indicator)
    this.legendOscillators[idxLegend].lines.forEach(line => {
      const oscillatorDataset = this.chartOscillatorConfig.data.datasets.indexOf(line, 0);
      this.chartOscillatorConfig.data.datasets.splice(oscillatorDataset, 1);
    });

    // update charts
    this.chartOscillatorConfig.update();

    // hide oscillator if none left
    if (this.chartOscillatorConfig.data.datasets.length === 0) {
      this.oscillatorOn = false;
    }

    // remove from legend
    this.legendOscillators.splice(idxLegend, 1);
  }


  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }

}
