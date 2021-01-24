import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { MatRadioChange } from '@angular/material/radio';
import { env } from '../environments/environment';

import { Chart, ChartPoint, ChartDataSets } from 'chart.js';
import { ChartService } from './chart.service';

import {
  Quote,
  IndicatorType,
  IndicatorParameters,

  // configs
  BollingerBandConfig,
  ParabolicSarConfig,
  RsiConfig,
  StochConfig,

  // results
  BollingerBandResult,
  EmaResult,
  ParabolicSarResult,
  RsiResult,
  StochResult

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

  loading = true;

  @ViewChild('chartOverlay', { static: true }) chartOverlayRef: ElementRef;
  chartOverlay: Chart;

  @ViewChild('chartRsi', { static: true }) chartRsiRef: ElementRef;
  chartRsi: Chart;
  chartRsiLabel: string;
  chartRsiOn = true;    // required ON due to card, likely?

  @ViewChild('chartStoch', { static: true }) chartStochRef: ElementRef;
  chartStoch: Chart;
  chartStochLabel: string;
  chartStochOn = true;  // required ON due to card, likely?

  @ViewChild('bottom') bottomRef: ElementRef;

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
    { code: 'RSI', name: 'Relative Strength Index' },
    { code: 'STOCH', name: 'Stochastic Oscillator' }
  ];

  // indicator parameter values
  readonly colors: string[] = ['DeepPink', 'DarkRed', 'Orange', 'Green', 'Blue'];
  readonly smNums: number[] = [3, 5, 10, 15, 25];
  readonly lgNums: number[] = [15, 30, 50, 100, 200];

  readonly bbConfigs: BollingerBandConfig[] = [
    { label: 'BB(15,2)', lookbackPeriod: 15, standardDeviations: 2 },
    { label: 'BB(20,2)', lookbackPeriod: 20, standardDeviations: 2 },
    { label: 'BB(45,3)', lookbackPeriod: 45, standardDeviations: 3 }
  ];
  readonly psarConfigs: ParabolicSarConfig[] = [
    { label: 'PSAR(0.01,0.15)', accelerationStep: 0.01, maxAccelerationFactor: 0.15 },
    { label: 'PSAR(0.02,0.2)', accelerationStep: 0.02, maxAccelerationFactor: 0.2 },
    { label: 'PSAR(0.03,0.25)', accelerationStep: 0.03, maxAccelerationFactor: 0.25 }
  ];
  readonly rsiConfigs: RsiConfig[] = [
    { label: 'RSI(5)', lookbackPeriod: 5 },
    { label: 'RSI(14)', lookbackPeriod: 14 },
    { label: 'RSI(30)', lookbackPeriod: 30 }
  ];
  readonly stochConfigs: StochConfig[] = [
    { label: 'STOCH(9,4)', lookbackPeriod: 9, signalPeriod: 4 },
    { label: 'STOCH(14,3)', lookbackPeriod: 14, signalPeriod: 3 },
    { label: 'STOCH(20,5)', lookbackPeriod: 20, signalPeriod: 5 },
  ];


  constructor(
    private readonly http: HttpClient,
    private readonly cs: ChartService
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
        this.addBaseStochChart();
        this.loading = false;

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addBaseOverlayChart() {

    const myChart: HTMLCanvasElement = this.chartOverlayRef.nativeElement as HTMLCanvasElement;
    const myConfig = this.cs.baseOverlayConfig();

    const price: number[] = [];
    const volume: number[] = [];
    const labels: Date[] = [];
    let sumVol = 0;

    this.history.forEach((q: Quote) => {
      price.push(q.close);
      volume.push(q.volume);
      labels.push(new Date(q.date));
      sumVol += q.volume;
    });

    // define base datasets
    myConfig.data = {
      datasets: [
        {
          type: 'line',
          label: 'Price',
          data: price,
          yAxisID: 'rightAxis',
          borderWidth: 2,
          borderColor: 'black',
          backgroundColor: 'black',
          pointRadius: 0,
          fill: false,
          spanGaps: false,
          order: 1
        },
        {
          type: 'bar',
          label: 'Volume',
          data: volume,
          yAxisID: 'volumeAxis',
          borderWidth: 2,
          borderColor: 'lightblue',
          backgroundColor: 'lightblue',
          pointRadius: 0,
          fill: true,
          spanGaps: true,
          order: 99
        }
      ]
    };

    // add labels
    myConfig.data.labels = labels;

    // get size for volume axis
    const volAxisSize = 15 * (sumVol / volume.length) || 0;
    myConfig.options.scales.yAxes[1].ticks.max = volAxisSize;

    // compose chart
    if (this.chartOverlay) this.chartOverlay.destroy();
    this.chartOverlay = new Chart(myChart.getContext('2d'), myConfig);

    // add initial samples
    this.addIndicatorEMA({ parameterOne: 18, color: 'darkOrange' });
    this.addIndicatorEMA({ parameterOne: 150, color: 'blue' });
  }


  addBaseRsiChart() {

    // construct chart
    this.chartRsiOn = false;
    const myChart: HTMLCanvasElement = this.chartRsiRef.nativeElement as HTMLCanvasElement;
    const myConfig = this.cs.baseOscillatorConfig();

    // reference lines
    const topThreshold: number[] = [];
    const bottomThreshold: number[] = [];
    const labels: Date[] = [];

    this.history.forEach((q: Quote) => {
      topThreshold.push(70);
      bottomThreshold.push(30);
      labels.push(new Date(q.date));
    });

    myConfig.data = {
      datasets: [
        {
          label: 'Overbought threshold',
          type: 'line',
          data: topThreshold,
          yAxisID: 'rightAxis',
          hideInLegendAndTooltip: true,
          borderWidth: 1,
          borderColor: 'darkRed',
          backgroundColor: 'darkRed',
          pointRadius: 0,
          spanGaps: false,
          fill: false,
          order: 99
        },
        {
          label: 'Oversold threshold',
          type: 'line',
          data: bottomThreshold,
          yAxisID: 'rightAxis',
          hideInLegendAndTooltip: true,
          borderWidth: 1,
          borderColor: 'darkGreen',
          backgroundColor: 'darkGreen',
          pointRadius: 0,
          spanGaps: true,
          fill: false,
          order: 99
        }
      ]
    };

    // add labels
    myConfig.data.labels = labels;

    // hide ref lines from tooltips
    myConfig.options.tooltips.filter = (tooltipItem) => (tooltipItem.datasetIndex > 1);

    // y-scale
    myConfig.options.scales.yAxes[0].ticks.max = 100;

    // compose chart
    if (this.chartRsi) this.chartRsi.destroy();
    this.chartRsi = new Chart(myChart.getContext('2d'), myConfig);
  }

  addBaseStochChart() {

    // construct chart
    this.chartStochOn = false;
    const myChart: HTMLCanvasElement = this.chartStochRef.nativeElement as HTMLCanvasElement;
    const myConfig = this.cs.baseOscillatorConfig();

    // reference lines
    const topThreshold: number[] = [];
    const bottomThreshold: number[] = [];
    const labels: Date[] = [];

    this.history.forEach((q: Quote) => {
      topThreshold.push(80);
      bottomThreshold.push(20);
      labels.push(new Date(q.date));
    });

    myConfig.data = {
      datasets: [
        {
          label: 'Overbought threshold',
          type: 'line',
          data: topThreshold,
          yAxisID: 'rightAxis',
          hideInLegendAndTooltip: true,
          borderWidth: 1,
          borderColor: 'darkRed',
          backgroundColor: 'darkRed',
          pointRadius: 0,
          spanGaps: false,
          fill: false,
          order: 99
        },
        {
          label: 'Oversold threshold',
          type: 'line',
          data: bottomThreshold,
          yAxisID: 'rightAxis',
          hideInLegendAndTooltip: true,
          borderWidth: 1,
          borderColor: 'darkGreen',
          backgroundColor: 'darkGreen',
          pointRadius: 0,
          spanGaps: true,
          fill: false,
          order: 99
        }
      ]
    };

    // add labels
    myConfig.data.labels = labels;

    // hide ref lines from tooltips
    myConfig.options.tooltips.filter = (tooltipItem) => (tooltipItem.datasetIndex > 1);

    // y-scale
    myConfig.options.scales.yAxes[0].ticks.max = 100;

    // compose chart
    if (this.chartStoch) this.chartStoch.destroy();
    this.chartStoch = new Chart(myChart.getContext('2d'), myConfig);

    // add initial sample
    this.addIndicatorSTOCH({ parameterOne: 21, parameterTwo: 7, color: 'black' });
  }


  // EDIT INDICATORS

  startAdd() {
    this.pickIndicator = true;

    // hide oscillators
    this.chartRsiOn = false;
    this.chartStochOn = false;

    this.scrollToBottom();
  }

  cancelAdd() {

    this.pickIndicator = false;
    this.pickedType = { code: undefined, name: undefined };

    this.pickedParams = {
      parameterOne: undefined,
      parameterTwo: undefined,
      parameterThree: undefined,
      color: undefined
    };

    // show oscillators
    this.legend
      .filter(g => g.chart === 'rsi' || g.chart === 'stoch')
      .forEach((i: Indicator) => {
        if (i.chart === 'rsi') this.chartRsiOn = true;
        if (i.chart === 'stoch') this.chartStochOn = true;
      });
  }


  pickType(t: IndicatorType) {

    this.pickedType = t;

    if (this.pickedType.code === 'BB') this.pickedParams.color = 'darkGray';
    if (this.pickedType.code === 'PSAR') this.pickedParams.color = 'purple';
    if (this.pickedType.code === 'RSI') this.pickedParams.color = 'black';
    if (this.pickedType.code === 'STOCH') this.pickedParams.color = 'black';

    this.scrollToBottom(200);
  }

  addIndicator() {

    // sorted alphabetically

    // bollinger bands
    if (this.pickedType.code === 'BB') {
      this.addIndicatorBB(this.pickedParams);
    }

    // exponential moving average
    if (this.pickedType.code === 'EMA') {
      this.addIndicatorEMA(this.pickedParams);
    }

    // parabolid sar
    if (this.pickedType.code === 'PSAR') {
      this.addIndicatorPSAR(this.pickedParams);
    }

    // relative strength indicator
    if (this.pickedType.code === 'RSI') {
      this.addIndicatorRSI(this.pickedParams);
    }

    // stochastic oscillator
    if (this.pickedType.code === 'STOCH') {
      this.addIndicatorSTOCH(this.pickedParams);
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

        const label = `BB(${params.parameterOne},${params.parameterTwo})`;

        // componse data
        const centerLine: ChartPoint[] = [];
        const upperLine: ChartPoint[] = [];
        const lowerLine: ChartPoint[] = [];

        bb.forEach((m: BollingerBandResult) => {
          centerLine.push({ x: new Date(m.date), y: this.toDecimals(m.sma, 3) });
          upperLine.push({ x: new Date(m.date), y: this.toDecimals(m.upperBand, 3) });
          lowerLine.push({ x: new Date(m.date), y: this.toDecimals(m.lowerBand, 3) });
        });

        // compose configurations
        const upperDataset: ChartDataSets = {
          type: 'line',
          label: 'BB Upperband',
          data: upperLine,
          borderWidth: 1,
          borderDash: [5, 2],
          borderColor: params.color,
          backgroundColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        const centerDataset: ChartDataSets = {
          type: 'line',
          label: 'BB Centerline',
          data: centerLine,
          borderWidth: 2,
          borderDash: [5, 2],
          borderColor: params.color,
          backgroundColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        const lowerDataset: ChartDataSets = {
          type: 'line',
          label: 'BB Lowerband',
          data: lowerLine,
          borderWidth: 1,
          borderDash: [5, 2],
          borderColor: params.color,
          backgroundColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlay.data.datasets.push(upperDataset);
        this.chartOverlay.data.datasets.push(centerDataset);
        this.chartOverlay.data.datasets.push(lowerDataset);
        this.chartOverlay.update();

        // add to legend
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [centerDataset, upperDataset, lowerDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  addIndicatorEMA(params: IndicatorParameters) {

    this.http.get(`${env.api}/EMA/${params.parameterOne}`, this.requestHeader())
      .subscribe((ema: EmaResult[]) => {

        const label = `EMA(${params.parameterOne})`;

        // componse data
        const emaLine: ChartPoint[] = [];

        ema.forEach((m: EmaResult) => {
          emaLine.push({ x: new Date(m.date), y: this.toDecimals(m.ema, 3) });
        });

        // compose configuration
        const emaDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: emaLine,
          borderWidth: 2,
          borderColor: params.color,
          backgroundColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlay.data.datasets.push(emaDataset);
        this.chartOverlay.update();

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

        const label = `PSAR(${params.parameterOne},${params.parameterTwo})`;

        // componse data
        const sarLine: ChartPoint[] = [];

        psar.forEach((m: ParabolicSarResult) => {
          sarLine.push({ x: new Date(m.date), y: this.toDecimals(m.sar, 3) });
        });

        // compose configurations
        const sarDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: sarLine,
          pointRadius: 1.5,
          pointBackgroundColor: params.color,
          pointBorderColor: params.color,
          fill: false,
          showLine: false,
          spanGaps: false
        };

        // add to chart
        this.chartOverlay.data.datasets.push(sarDataset);
        this.chartOverlay.update();

        // add to legend
        this.legend.push({ label: label, chart: 'overlay', color: params.color, lines: [sarDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  rsiChange(event: MatRadioChange) {
    const rsi: RsiConfig = event.value;
    this.pickedParams.parameterOne = rsi.lookbackPeriod;
  }

  addIndicatorRSI(params: IndicatorParameters) {

    // remove old indicators
    this.legend
      .filter(g => g.chart === 'rsi')
      .forEach((i: Indicator) => this.deleteIndicator(i));

    // fetch new indicator
    this.http.get(`${env.api}/RSI/${params.parameterOne}`, this.requestHeader())
      .subscribe((rsi: RsiResult[]) => {

        const label = `RSI(${params.parameterOne})`;
        this.chartRsiLabel = label;
        this.chartRsiOn = true;

        // componse data
        const rsiLine: ChartPoint[] = [];

        rsi.forEach((m: RsiResult) => {
          rsiLine.push({ x: new Date(m.date), y: this.toDecimals(m.rsi, 3) });
        });

        // compose configuration
        const rsiDataset: ChartDataSets = {
          type: 'line',
          label: label,
          data: rsiLine,
          borderWidth: 2,
          borderColor: params.color,
          backgroundColor: params.color,
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


  stochChange(event: MatRadioChange) {
    const stoch: StochConfig = event.value;
    this.pickedParams.parameterOne = stoch.lookbackPeriod;
    this.pickedParams.parameterTwo = stoch.signalPeriod;
  }

  addIndicatorSTOCH(params: IndicatorParameters) {

    // remove old indicators
    this.legend
      .filter(g => g.chart === 'stoch')
      .forEach((i: Indicator) => this.deleteIndicator(i));

    // add new indicator
    this.http.get(`${env.api}/STOCH/${params.parameterOne}/${params.parameterTwo}`, this.requestHeader())
      .subscribe((stoch: StochResult[]) => {

        const label = `STOCH(${params.parameterOne},${params.parameterTwo})`;
        this.chartStochLabel = label;
        this.chartStochOn = true;

        // componse data
        const oscLine: ChartPoint[] = [];
        const sigLine: ChartPoint[] = [];

        stoch.forEach((m: StochResult) => {
          oscLine.push({ x: new Date(m.date), y: this.toDecimals(m.oscillator, 3) });
          sigLine.push({ x: new Date(m.date), y: this.toDecimals(m.signal, 3) });
        });

        // compose configuration
        const oscDataset: ChartDataSets = {
          type: 'line',
          label: label + ' Oscillator',
          data: oscLine,
          borderWidth: 2,
          borderColor: params.color,
          backgroundColor: params.color,
          pointRadius: 0,
          fill: false,
          spanGaps: false,
          order: 1
        };

        const sigDataset: ChartDataSets = {
          type: 'line',
          label: label + ' Signal',
          data: sigLine,
          borderWidth: 1.5,
          borderColor: 'red',
          backgroundColor: 'red',
          pointRadius: 0,
          fill: false,
          spanGaps: false,
          order: 2
        };

        // add to chart
        this.chartStoch.data.datasets.push(oscDataset);
        this.chartStoch.data.datasets.push(sigDataset);
        this.chartStoch.update();

        // add to legend
        this.legend.push({ label: label, chart: 'stoch', color: params.color, lines: [oscDataset, sigDataset] });

      }, (error: HttpErrorResponse) => { console.log(error); });
  }


  // GENERAL OPERATIONS

  deleteIndicator(indicator: Indicator) {

    const idxLegend = this.legend.indexOf(indicator, 0);

    // remove from chart (can be multiple lines per indicator)
    this.legend[idxLegend].lines.forEach(line => {

      // overlay
      if (indicator.chart === 'overlay') {
        const overlayDataset = this.chartOverlay.data.datasets.indexOf(line, 0);
        this.chartOverlay.data.datasets.splice(overlayDataset, 1);
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

      // stoch
      if (indicator.chart === 'stoch') {
        const stochDataset = this.chartStoch.data.datasets.indexOf(line, 0);
        this.chartStoch.data.datasets.splice(stochDataset, 1);

        // hide rsi if none left
        if (this.chartStoch.data.datasets.length <= 2) {
          this.chartStochOn = false;
        }

        this.chartStoch.update();
      }
    });

    // update charts
    this.chartOverlay.update();


    // remove from legend
    this.legend.splice(idxLegend, 1);
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

  scrollToBottom(delayMs: number = 0) {
    setTimeout(() => {
      this.bottomRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    }, delayMs);
  }
}
