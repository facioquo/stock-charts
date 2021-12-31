import { Injectable } from '@angular/core';

import 'chartjs-adapter-date-fns';
import 'chartjs-chart-financial';

import { enUS } from 'date-fns/locale';
import { add, parseISO } from 'date-fns';

import {
  Chart,
  ChartConfiguration,
  FontSpec,
  ScaleOptions,
  Tick
} from 'chart.js';

// extensions
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
} from 'chartjs-chart-financial';

// plugins
import annotationPlugin, { AnnotationOptions, ScaleValue }
  from 'chartjs-plugin-annotation';

Chart.register(
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
  annotationPlugin)

@Injectable()
export class ChartService {

  yAxisTicks: Tick[] = [];

  baseConfig() {

    const commonXaxes = this.commonXAxes();

    const config: ChartConfiguration = {

      type: 'line',
      data: {
        datasets: []
      },
      options: {
        plugins: {
          title: {
            display: false
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          },
          annotation: {
            clip: false,
            drawTime: 'afterDraw',
            annotations: []
          }
        },
        layout: {
          padding: 0
        },
        responsive: true,
        maintainAspectRatio: false,

        scales: {
          xAxis: commonXaxes,
          yAxis: {
            display: true,
            type: 'linear',
            axis: 'y',
            position: 'right',
            beginAtZero: false,
            ticks: {
              mirror: true,
              padding: -5,
              font: {
                size: 10
              },
              showLabelBackdrop: true,
              backdropColor: '#212121',
              backdropPadding: 2
            },
            grid: {
              drawOnChartArea: true,
              drawTicks: false,
              drawBorder: false,
              color: function (context) {
                if (context.tick.label === '') {
                  return '#212121';
                } else {
                  return '#424242';
                }
              }
            }
          }
        }
      }
    };

    return config;
  }

  baseOverlayConfig(): ChartConfiguration {

    const config = this.baseConfig();
    config.type = 'candlestick';

    // aspect ratio
    config.options.maintainAspectRatio = true;
    config.options.aspectRatio = 2;

    // format y-axis, add dollar sign
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

      if (index === 0 || index === values.length - 1) return '';
      else
        return '$' + value;
    };

    // volume axis
    config.options.scales.volumeAxis = {
      display: false,
      type: 'linear',
      axis: 'y',
      position: 'left',
      beginAtZero: true
    } as ScaleOptions;

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    const config = this.baseConfig();

    // aspect ratio
    config.options.maintainAspectRatio = true;
    config.options.aspectRatio = 7;

    // remove x-axis
    config.options.scales.xAxis.display = false;

    // remove first and last y-axis labels
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

      if (index === 0 || index === values.length - 1) return '';
      else
        return value;
    };

    return config;
  }

  commonXAxes(): ScaleOptions {

    const axes: ScaleOptions = {
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
        source: "auto",
        padding: 0,
        autoSkip: true,
        maxRotation: 0,
        minRotation: 0,
        font: {
          size: 9
        },
      },
      grid: {
        drawOnChartArea: false,
        drawBorder: false,
        tickLength: 2
      }
    };

    return axes;
  }

  commonAnnotation(
    label: string,
    fontColor: string,
    xPos: ScaleValue,
    yPos: ScaleValue,
    xAdj: number = 0,
    yAdj: number = 0
  ): AnnotationOptions {

    const legendFont: FontSpec = {
      family: "Roboto",
      size: 11,
      style: "normal",
      weight: "normal",
      lineHeight: 1,
    };

    const annotation: AnnotationOptions = {
      type: 'label',
      content: [label],
      font: legendFont,
      color: fontColor,
      backgroundColor: 'rgba(33,33,33,0.9)',
      padding: 1,
      position: 'start',
      xScaleID: 'xAxis',
      yScaleID: 'yAxis',
      xValue: xPos,
      yValue: yPos,
      xAdjust: xAdj,
      yAdjust: yAdj
    };

    return annotation;
  }
}
