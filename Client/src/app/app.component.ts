import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';
import { Chart, ChartPoint, ChartDataSets } from 'chart.js';
import { MatRadioChange } from '@angular/material/radio';
import { CrosshairOptions } from 'chartjs-plugin-crosshair';
import 'chartjs-plugin-crosshair';

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
  chart: string;
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

  @ViewChild('chartRsi', { static: true }) chartRsiRef: ElementRef;
  chartRsi: Chart;
  chartRsiOn = true;  // TODO: why can't we start with this off?
  chartRsiLabel = '';

  history: Quote[] = [];
  legend: Indicator[] = [];

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
        this.addBaseRsiChart();
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
    const crosshairPluginOptions = this.crosshairPluginOptions();

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
          display: false
        },
        legend: {
          display: false
        },
        tooltips: {
          mode: 'index',
          intersect: false
        },
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 10,
            bottom: 0
          }
        },
        scales: {
          xAxes: [{
            display: true,
            type: 'time',
            time: {
              unit: 'month' as Chart.TimeUnit,
              displayFormats: {
                month: 'MMM'
              }
            },
            ticks: {
              padding: 0,
              autoSkip: true,
              autoSkipPadding: 8,
              fontSize: 9,
              maxRotation: 0,
              minRotation: 0,
            },
            gridLines: {
              drawOnChartArea: true,
              tickMarkLength: 2
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
            ticks: {
              autoSkip: true,
              autoSkipPadding: 8,
              fontSize: 9,
              maxRotation: 0,
              minRotation: 0,
            },
            gridLines: {
              drawOnChartArea: false,
              tickMarkLength: 1
            }

          }],
          yAxes: [
            {
              id: 'priceAxis',
              display: true,
              position: 'right',
              scaleLabel: {
                display: false,
                labelString: 'price'
              },
              ticks: {
                autoSkip: true,
                autoSkipPadding: 3,
                beginAtZero: false,
                padding: 5,
                fontSize: 10
              },
              gridLines: {
                drawOnChartArea: true,
                drawTicks: false
              }
            },
            {
              id: 'volumeAxis',
              display: false,
              position: 'left',
              ticks: {
                beginAtZero: true,
                max: volAxisSize
              }
            }
          ],
        },
        plugins: {
          crosshair: crosshairPluginOptions
        }
      }
    });

    this.addIndicatorEMA('EMA', { parameterOne: 25, color: 'red' });
    this.addIndicatorEMA('EMA', { parameterOne: 150, color: 'darkGreen' });
  }


  addBaseRsiChart() {

    this.chartRsiOn = false;
    const topThreshold: ChartPoint[] = [];
    const bottomThreshold: ChartPoint[] = [];

    this.history.forEach((q: Quote) => {
      topThreshold.push({ x: q.date, y: 70 });
      bottomThreshold.push({ x: q.date, y: 30 });
    });

    const crosshairPluginOptions = this.crosshairPluginOptions();

    const myChart: HTMLCanvasElement = this.chartRsiRef.nativeElement as HTMLCanvasElement;

    this.chartRsi = new Chart(myChart.getContext('2d'), {
      type: 'bar',
      data: {
        datasets: [
          {
            label: 'Overbought threshold',
            type: 'line',
            data: topThreshold,
            yAxisID: 'yAxis',
            borderWidth: 1,
            borderColor: 'darkRed',
            pointRadius: 0,
            fill: false,
            spanGaps: false,
            order: 99
          },
          {
            label: 'Oversold threshold',
            type: 'line',
            data: bottomThreshold,
            yAxisID: 'yAxis',
            borderWidth: 1,
            borderColor: 'darkGreen',
            pointRadius: 0,
            fill: false,
            spanGaps: true,
            order: 99
          }
        ]
      },
      options: {

        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltips: {
          mode: 'index',
          intersect: false,
          filter: (tooltipItem) => !(tooltipItem.datasetIndex <= 1)
        },

        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
        },
        scales: {
          xAxes: [{
            display: true,
            type: 'time',
            time: {
              unit: 'month' as Chart.TimeUnit,
              displayFormats: {
                month: 'MMM'
              }
            },
            ticks: {
              padding: 0,
              autoSkip: true,
              autoSkipPadding: 8,
              fontSize: 9,
              maxRotation: 0,
              minRotation: 0,
            },
            gridLines: {
              drawOnChartArea: true,
              tickMarkLength: 2
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
            ticks: {
              autoSkip: true,
              autoSkipPadding: 8,
              fontSize: 9,
              maxRotation: 0,
              minRotation: 0,
            },
            gridLines: {
              drawOnChartArea: false,
              tickMarkLength: 1
            }
          }],
          yAxes: [{
            id: 'yAxis',
            display: true,
            position: 'right',
            ticks: {
              autoSkip: true,
              autoSkipPadding: 5,
              beginAtZero: true,
              max: 100,
              padding: 5,
              fontSize: 10
            },
            gridLines: {
              drawOnChartArea: true,
              drawTicks: false
            }
          }],
        },
        plugins: {
          crosshair: crosshairPluginOptions
        }
      }
    });
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
    if (this.pickedType.code === 'RSI') this.pickedParams.color = 'darkBlue';
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
      this.addIndicatorRSI(this.pickedParams);
    }

    // simple moving average
    if (this.pickedType.code === 'SMA') {
      this.addIndicatorSMA(this.pickedType.code, this.pickedParams);
    }

    this.cancelAdd();

  }


  // INDICATORS

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
          smaLine.push({ x: m.date, y: this.toDecimals(m.sma, 3) });
          upperLine.push({ x: m.date, y: this.toDecimals(m.upperBand, 3) });
          lowerLine.push({ x: m.date, y: this.toDecimals(m.lowerBand, 3) });
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
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [smaDataset, upperDataset, lowerDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addIndicatorEMA(type: string, params: IndicatorParameters) {

    this.http.get(`${env.api}/${type}/${params.parameterOne}`, this.requestHeader())
      .subscribe((ema: EmaResult[]) => {

        const label = `${type.toUpperCase()} (${params.parameterOne})`;

        // componse data
        const emaLine: ChartPoint[] = [];

        ema.forEach((m: EmaResult) => {
          emaLine.push({ x: m.date, y: this.toDecimals(m.ema, 3) });
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
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [emaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  psarChange(event: MatRadioChange) {
    const psar: ParabolicSarConfig = event.value;
    this.pickedParams.parameterOne = psar.accelerationStep;
    this.pickedParams.parameterTwo = psar.maxAccelerationFactor;
  }

  addIndicatorPSAR(params: IndicatorParameters) {

    // remove old to clear chart
    this.legend.filter(x => x.label.startsWith('PSAR')).forEach(x => {
      this.deleteIndicator(x);
    });

    // add new
    this.http.get(`${env.api}/PSAR/${params.parameterOne}/${params.parameterTwo}`, this.requestHeader())
      .subscribe((psar: ParabolicSarResult[]) => {

        const label = `PSAR (${params.parameterOne},${params.parameterTwo})`;

        // componse data
        const sarLine: ChartPoint[] = [];

        psar.forEach((m: ParabolicSarResult) => {
          sarLine.push({ x: m.date, y: this.toDecimals(m.sar, 3) });
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
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [sarDataset] });

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
        this.chartRsiLabel = label;
        this.chartRsiOn = true;

        // componse data
        const rsiLine: ChartPoint[] = [];

        rsi.forEach((m: RsiResult) => {
          rsiLine.push({ x: m.date, y: this.toDecimals(m.rsi, 3) });
        });

        // compose configuration
        const rsiDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: rsiLine,
          borderWidth: 2,
          borderColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartRsi.data.datasets.push(rsiDataset);
        this.chartRsi.update();

        // add to legend
        this.legend.push({ label: label, chart: 'rsi', color: params.color, lines: [rsiDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addIndicatorSMA(type: string, params: IndicatorParameters) {

    this.http.get(`${env.api}/${type}/${params.parameterOne}`, this.requestHeader())
      .subscribe((sma: SmaResult[]) => {

        const label = `${type.toUpperCase()} (${params.parameterOne})`;

        // componse data
        const smaLine: ChartPoint[] = [];

        sma.forEach((m: SmaResult) => {
          smaLine.push({ x: m.date, y: this.toDecimals(m.sma, 3) });
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
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [smaDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  // GENERAL OPERATIONS

  deleteIndicator(indicator: Indicator) {

    const idxLegend = this.legend.indexOf(indicator, 0);

    // remove from chart (can be multiple lines per indicator)
    this.legend[idxLegend].lines.forEach(line => {

      // overlay
      if (indicator.chart === 'overlay') {
        const overlayDataset = this.chartOverlayConfig.data.datasets.indexOf(line, 0);
        this.chartOverlayConfig.data.datasets.splice(overlayDataset, 1);
      }

      // rsi
      if (indicator.chart === 'rsi') {
        const rsiDataset = this.chartRsi.data.datasets.indexOf(line, 0);
        this.chartRsi.data.datasets.splice(rsiDataset, 1);

        // hide rsi if none left
        if (this.chartRsi.data.datasets.length <= 2) {
          this.chartRsiOn = false;
        }

        this.chartRsi.update();
      }
    });

    // update charts
    this.chartOverlayConfig.update();


    // remove from legend
    this.legend.splice(idxLegend, 1);
  }


  requestHeader(): { headers?: HttpHeaders } {

    const simpleHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');

    return { headers: simpleHeaders };
  }

  crosshairPluginOptions(): CrosshairOptions {

    // ref: https://github.com/abelheinsbroek/chartjs-plugin-crosshair

    const crosshairOptions: CrosshairOptions = {
      line: {
        color: '#F66',  // crosshair line color
        width: 1        // crosshair line width
      },
      sync: {
        enabled: true,            // enable trace line syncing with other charts
        group: 1,                 // chart group (can be unique set of groups), all are group 1 now
        suppressTooltips: false   // suppress tooltips when showing a synced tracer
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
        // tslint:disable-next-line: space-before-function-paren only-arrow-functions
        beforeZoom: function (start, end) {                  // called before zoom, return false to prevent zoom
          return true;
        },
        // tslint:disable-next-line: space-before-function-paren only-arrow-functions
        afterZoom: function (start, end) {                   // called after zoom
        }
      }
    };

    return crosshairOptions;
  }

  toDecimals(value: number, decimalPlaces: number): number {
    if (value === null) return null;
    return value.toFixed(decimalPlaces) as unknown as number;
  }
}
