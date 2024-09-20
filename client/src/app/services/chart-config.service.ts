import { Injectable } from '@angular/core';
import { UserConfigService } from './user-config.service';

import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';

import {
  BarController,
  BarElement,
  CartesianScaleOptions,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartDataset,
  ChartOptions,
  Filler,
  FontSpec,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  ScaleOptions,
  ScatterDataPoint,
  Tick,
  TimeSeriesScale,
  Tooltip
} from 'chart.js';

// extensions
import {
  CandlestickController,
  CandlestickElement
} from 'src/assets/js/chartjs-chart-financial';

// plugins
import AnnotationPlugin, { AnnotationOptions, ScaleValue }
  from 'chartjs-plugin-annotation';

import CrosshairPlugin, { CrosshairOptions }
  from 'src/assets/js/chartjs-plugin-crosshair';
import { IndicatorResult, IndicatorResultConfig } from '../chart/chart.models';

// register extensions and plugins
Chart.register(

  // controllers
  BarController,
  CandlestickController,
  LineController,
  Tooltip,

  // elements
  BarElement,
  CandlestickElement,
  LineElement,
  PointElement,

  // plugins
  CrosshairPlugin,
  Filler,

  // scales
  CategoryScale,
  LinearScale,
  TimeSeriesScale
);


@Injectable()
export class ChartConfigService {

  constructor(
    private readonly usr: UserConfigService
  ) { }

  baseOverlayConfig(volumeAxisSize: number): ChartConfiguration {

    // base configuration
    const config: ChartConfiguration = {

      type: 'candlestick',
      data: {
        datasets: []
      },
      options: this.baseChartOptions()
    };

    // format y-axis, add dollar sign
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      if (index === 0 || index === values.length - 1) return null;
      else
        return '$' + value;
    };

    // volume axis
    config.options.scales.volumeAxis = {
      display: false,
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

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    // base configuration
    const config: ChartConfiguration = {

      type: 'candlestick',  // TODO: should/could this be line or bar?
      data: {
        datasets: []
      },
      options: this.baseChartOptions()
    };

    // remove x-axis
    config.options.scales.xAxis.display = false;

    // format y-axis
    const y = config.options.scales.yAxis as CartesianScaleOptions;

    // size to data, instead of next tick
    // y.bounds = "data";

    // remove first and last y-axis labels
    y.ticks.callback = (value: number, index, values) => {

      const v = Math.abs(value);

      if (index === 0 || index === values.length - 1) return null;

      // otherwise, condense large/small display values
      else if (v > 10000000000)
        return Math.trunc(value / 1000000000) + "B";
      else if (v > 10000000)
        return Math.trunc(value / 1000000) + "M";
      else if (v > 10000)
        return Math.trunc(value / 1000) + "K";
      else if (v > 10)
        return Math.trunc(value);
      else if (v > 0)
        return Math.round((value + Number.EPSILON) * 10) / 10;
      else if (v > 0.001)
        return Math.round((value + Number.EPSILON) * 100000) / 100000;
      else
        return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
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
          enabled: this.usr.showTooltips,
          mode: 'interpolate',
          intersect: false
        },
        annotation: {
          clip: false,
          annotations: []
        },
        crosshair: this.crosshairPluginOptions()
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
      scales: {
        xAxis: this.defaultXAxisOptions(),
        yAxis: {
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
              family: "Google Sans",
              size: 12,
              lineHeight: 1
            },
            showLabelBackdrop: true,
            backdropColor: this.usr.isDarkTheme ? '#12131680' : '#FAF9FD90',
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
            color: this.usr.isDarkTheme ? '#2E2E2E' : '#E0E0E0'
          }
        }
      }
    };

    return options;
  }

  defaultXAxisOptions(): ScaleOptions {

    const options: ScaleOptions = {
      alignToPixels: true,
      display: false,
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
        source: "auto",
        padding: 0,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 9
        },
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

  crosshairPluginOptions(): CrosshairOptions {

    if (this.usr.showCrosshairs == false) return null;

    const crosshairOptions: CrosshairOptions = {
      line: {
        color: '#F66',                                      // crosshair line color
        width: 1                                            // crosshair line width
      },
      sync: {
        enabled: true,                                      // enable trace line syncing with other charts
        group: 1,                                           // chart group (can be unique set of groups)
        suppressTooltips: true                              // suppress tooltips (on other chart) when synced tracer
      },
      snap: {
        enabled: true                                       // snap to data points
      }
    };

    return crosshairOptions;
  }

  baseDataset(r: IndicatorResult, c: IndicatorResultConfig) {

    // FIX: why won't candlestick work with ChartDataset return type?

    switch (r.lineType) {

      case 'solid':
        const lineDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
          pointRadius: 0,
          borderWidth: r.lineWidth,
          borderColor: r.color,
          backgroundColor: r.color,
          fill: c.fill == null ? false : {
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
          yAxisID: 'yAxis',
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
          yAxisID: 'yAxis',
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
          yAxisID: 'yAxis',
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
          yAxisID: 'yAxis',
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
        // hide instead of exclude "none" lines,
        // otherwise, it breaks line offset fill
        const noneDataset: ChartDataset = {
          label: r.label,
          type: 'line',
          data: [],
          yAxisID: 'yAxis',
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
}
