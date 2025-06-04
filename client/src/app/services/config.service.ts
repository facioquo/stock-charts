import { Injectable } from '@angular/core';
import { UserService } from './user.service';

import {
  IndicatorResult,
  IndicatorResultConfig
} from '../pages/chart/chart.models';

// chart.js
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

import {
  CartesianScaleOptions,
  ChartConfiguration,
  ChartDataset,
  ChartOptions,
  FontSpec,
  ScaleOptions
} from 'chart.js';

// plugins
import {
  AnnotationOptions,
  LabelAnnotationOptions,
  ScaleValue
} from 'chartjs-plugin-annotation';

@Injectable({
  providedIn: 'root'
})
export class ChartConfigService {

  fontFamily = "'Google Sans', Roboto, Verdana, Helvetica, Arial, sans-serif";

  constructor(
    private readonly usr: UserService
  ) { }

  baseOverlayConfig(volumeAxisSize: number): ChartConfiguration {

    // base configuration
    const config: ChartConfiguration = {

      type: 'candlestick',
      data: {
        datasets: []
      },
      options: this.baseOverlayOptions(volumeAxisSize)
    };

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    // base configuration
    const config: ChartConfiguration = {

      type: 'candlestick',  // TODO: should/could this be line or bar?
      data: {
        datasets: []
      },
      options: this.baseOscillatorOptions()
    };

    return config;
  }

  baseChartOptions(): ChartOptions {

    const options: ChartOptions = {
      plugins: {
        title: {
          display: false
        },
        legend: {
          display: false
        },
        tooltip: {
          enabled: this.usr.settings.showTooltips,
          intersect: false
        },
        annotation: {
          clip: false,
          annotations: {}
        }
      },
      layout: {
        padding: {
          top: 0,
          left: 1,
          bottom: 0,
          right: 1
        },
        autoPadding: false
      },
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      font: {
        family: this.fontFamily
      },
      scales: {
        x: this.defaultXAxisOptions(),
        y: {
          alignToPixels: true,
          display: true,
          type: 'linear',
          axis: 'y',
          position: 'right',
          beginAtZero: false,
          ticks: {
            display: true,
            mirror: true,
            font: {
              family: this.fontFamily,
              size: 12,
              lineHeight: 1
            },
            showLabelBackdrop: true,
            backdropColor: this.usr.settings.isDarkTheme ? '#12131680' : '#FAF9FD90',
            backdropPadding: {
              top: 0,
              left: 5,
              bottom: 0,
              right: 0
            },
            padding: 0
          },
          border: {
            display: false
          },
          grid: {
            drawOnChartArea: true,
            drawTicks: false,
            lineWidth: 0.5,
            color: this.usr.settings.isDarkTheme ? '#2E2E2E' : '#E0E0E0'
          }
        }
      }
    };

    return options;
  }

  baseOverlayOptions(volumeAxisSize: number): ChartOptions {

    const options = this.baseChartOptions();

    // format y-axis (helper context)
    const y = options.scales.y as CartesianScaleOptions;

    // size to data, instead of next tick
    // y.bounds = 'data';  // fix: needs formatting

    // format primary y-axis labels
    y.ticks.callback = (value, index, values) => {

      // remove first and last y-axis labels
      if (index === 0 || index === values.length - 1) return null;

      // otherwise, add dollar sign
      else
        return '$' + value;
    };

    // define secondary y-axis for volume
    options.scales.volumeAxis = {
      display: false,  // hide by default
      type: 'linear',
      axis: 'y',
      position: 'left',
      beginAtZero: true,
      padding: 0,
      border: {
        display: false
      },
      max: volumeAxisSize
    } as ScaleOptions;

    return options;
  }

  baseOscillatorOptions(): ChartOptions {

    const options = this.baseChartOptions();

    // remove x-axis
    options.scales.x.display = false;

    // format y-axis (helper context)
    const y = options.scales.y as CartesianScaleOptions;

    // rescale labels
    y.ticks.callback = (value: number, index, values) => {

      const v = Math.abs(value);

      // remove first and last y-axis labels
      if (index === 0 || index === values.length - 1) return null;

      // otherwise, condense large/small display values
      else if (v > 10000000000)
        return Math.trunc(value / 1000000000) + 'B';
      else if (v > 10000000)
        return Math.trunc(value / 1000000) + 'M';
      else if (v > 10000)
        return Math.trunc(value / 1000) + 'K';
      else if (v > 10)
        return Math.trunc(value);
      else if (v > 0)
        return Math.round((value + Number.EPSILON) * 10) / 10;
      else if (v > 0.001)
        return Math.round((value + Number.EPSILON) * 100000) / 100000;
      else
        return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
    };

    return options;
  }

  defaultXAxisOptions(): ScaleOptions {

    const options: ScaleOptions = {
      alignToPixels: true,
      display: false,  // hide by default
      offset: false,   // centers candles/bars
      type: 'timeseries',
      time: {
        unit: 'day'
      },
      adapters: {
        date: {
          locale: enUS
        },
      },
      ticks: {
        display: false,
        source: 'auto',
        padding: 0,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 9
        }
      },
      border: {
        display: false
      },
      grid: {
        display: false,
        drawOnChartArea: false
      }
    };

    return options;
  }

  baseDataset(
    r: IndicatorResult,
    c: IndicatorResultConfig) {

    switch (r.lineType) {

      case 'solid':
        const lineDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'y',
          pointRadius: 0,
          borderWidth: r.lineWidth,
          borderColor: r.color,
          backgroundColor: r.color,
          fill: c.fill === null ? false : {
            target: c.fill.target,
            above: c.fill.colorAbove,
            below: c.fill.colorBelow
          },
          order: r.order
        };
        return lineDataset;

      case 'dash':
        const dashDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'y',
          pointRadius: 0,
          borderWidth: r.lineWidth,
          borderDash: [3, 2],
          borderColor: r.color,
          backgroundColor: r.color,
          order: r.order
        };
        return dashDataset;

      case 'dots':
        const dotsDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'y',
          pointRadius: r.lineWidth,
          pointBorderWidth: 0,
          pointBorderColor: r.color,
          pointBackgroundColor: r.color,
          showLine: false,
          order: r.order
        };
        return dotsDataset;

      case 'bar':
        const barDataset: ChartDataset = {
          label: r.label,
          type: 'bar',
          data: [],
          yAxisID: 'y',
          borderWidth: 0,
          borderColor: r.color,
          backgroundColor: r.color,
          order: r.order
        };

        // add stack, if specified
        if (c.stack) {
          barDataset.stack = c.stack;
        }
        return barDataset;

      case 'pointer':
        const ptDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'y',
          pointRadius: r.lineWidth,
          pointBorderWidth: 0,
          pointBorderColor: r.color,
          pointBackgroundColor: r.color,
          pointStyle: 'triangle',
          pointRotation: 0,
          showLine: false,
          order: r.order
        };
        return ptDataset;

      case 'none':
        // hide instead of exclude 'none' lines,
        // otherwise, it breaks line offset fill
        const noneDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'y',
          showLine: false,
          pointRadius: 0,
          borderWidth: 0,
          borderColor: r.color,
          backgroundColor: r.color,
          fill: false,
          order: r.order
        };
        return noneDataset;
    }
  }

  commonLegendAnnotation(
    labelText: string,
    xPos: ScaleValue,
    yPos: ScaleValue,
    yAdj: number = 0
  ): AnnotationOptions & LabelAnnotationOptions {

    const fontColor = this.usr.settings.isDarkTheme ? '#757575' : '#121316';
    const fillColor = this.usr.settings.isDarkTheme ? '#12131680' : '#FAF9FD90';

    const legendFont: FontSpec = {
      family: this.fontFamily,
      size: 13,
      style: 'normal',
      weight: 'normal',
      lineHeight: 1,
    };

    const annotation: AnnotationOptions & LabelAnnotationOptions = {
      id: 'legend',
      type: 'label',
      content: [labelText],
      textAlign: 'start',
      font: legendFont,
      color: fontColor,
      backgroundColor: fillColor,
      padding: 0,
      position: 'start',
      xScaleID: 'x',
      yScaleID: 'y',
      xValue: xPos,
      yValue: yPos,
      xAdjust: 0,
      yAdjust: yAdj
    };

    return annotation;
  }
}
