import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import { add, parseISO } from 'date-fns';
import { Guid } from "guid-typescript";

import {
  Chart,
  ChartConfiguration,
  ChartDataset,
  FontSpec,
  Interaction,
  ScaleOptions,
  ScatterDataPoint,
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

import {
  CrosshairPlugin,
  CrosshairOptions,
  Interpolate
}
from 'chartjs-plugin-crosshair'

// internal models
import {
  ChartThreshold,
  IndicatorListing,
  IndicatorParam,
  IndicatorParamConfig,
  IndicatorResult,
  IndicatorResultConfig,
  IndicatorSelection
} from './chart.models';
import { HttpErrorResponse } from '@angular/common/http';

Chart.register(
  CandlestickController,
  OhlcController,
  CandlestickElement,
  OhlcElement,
  annotationPlugin,
  CrosshairPlugin);

Interaction.modes.interpolate = Interpolate;

@Injectable()
export class ChartService {

  constructor(
    private readonly api: ApiService
  ) { }

  yAxisTicks: Tick[] = [];
  listings: IndicatorListing[] = [];
  selections: IndicatorSelection[] = [];
  chartOverlay: Chart;

  // solid background plugin (for copy/paste)
  baseConfig() {

    const commonXaxes = this.commonXAxes();
    const crosshairOptions = this.crosshairPluginOptions();

    const backgroundPlugin =
    {
      id: 'background',
      beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext('2d');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#212121';
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      }
    };

    const config: ChartConfiguration = {

      type: 'candlestick',
      data: {
        datasets: []
      },
      plugins: [
        backgroundPlugin
      ],
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
            mode: 'interpolate',
            intersect: false
          },
          annotation: {
            clip: false,
            drawTime: 'afterDraw',
            annotations: []
          },
          crosshair: crosshairOptions
        },
        layout: {
          padding: 0,
          autoPadding: false
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
              display: true,
              mirror: true,
              padding: -5,
              font: {
                size: 10,
                lineHeight: 1
              },
              showLabelBackdrop: true,
              backdropColor: '#212121',
              backdropPadding: {
                top: 0,
                left: 2,
                bottom: 0,
                right: 2
              },
            },
            grid: {
              drawOnChartArea: true,
              drawTicks: false,
              drawBorder: false,
              lineWidth: 0.5,
              color: function (context) {
                if (context.tick.label === null) {
                  return 'transparent';
                } else {
                  return '#424242';
                }
              },

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

    // format y-axis, add dollar sign
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

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
      beginAtZero: true
    } as ScaleOptions;

    return config;
  }

  baseOscillatorConfig(): ChartConfiguration {

    const config = this.baseConfig();

    // remove x-axis
    config.options.scales.xAxis.display = false;

    // remove first and last y-axis labels
    config.options.scales.yAxis.ticks.callback = (value, index, values) => {

      this.yAxisTicks = values;

      if (index === 0 || index === values.length - 1) return null;
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

  crosshairPluginOptions(): CrosshairOptions {

    const crosshairOptions: CrosshairOptions = {
        line: {
            color: '#F66',                                      // crosshair line color
            width: 1                                            // crosshair line width
        },
        sync: {
            enabled: true,                                      // enable trace line syncing with other charts
            group: 1,                                           // chart group (can be unique set of groups)
            suppressTooltips: true                              // suppress tooltips when showing a synced tracer
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
            beforeZoom: (start, end) => {                       // called before zoom, return false to prevent zoom
                return true;
            },
            afterZoom: (start, end) => {                        // called after zoom
            }
        }
    };

    return crosshairOptions;
  }


  defaultSelection(uiid: string): IndicatorSelection {

    const listing = this.listings.find(x => x.uiid == uiid);

    const selection: IndicatorSelection = {
      ucid: this.getGuid("chart"),
      uiid: listing.uiid,
      label: listing.labelTemplate,
      chartType: listing.chartType,
      params: [],
      results: []
    };

    // load default parameters
    listing.parameters.forEach((config: IndicatorParamConfig) => {

      const param = {
        paramName: config.paramName,
        displayName: config.displayName,
        minimum: config.minimum,
        maximum: config.maximum,
        value: config.defaultValue
      } as IndicatorParam

      selection.params.push(param);
    });

    // load default results colors and containers
    listing.results.forEach((config: IndicatorResultConfig) => {

      const result = {
        label: config.labelTemplate,
        color: config.defaultColor,
        dataName: config.dataName,
        displayName: config.displayName,
        lineType: config.lineType,
        lineWidth: config.lineWidth,
        order: listing.order
      } as IndicatorResult

      selection.results.push(result);
    });

    return selection;
  }

  selectionTokenReplacement(selection: IndicatorSelection): IndicatorSelection {

    selection.params.forEach((param, index) => {

      selection.label = selection.label.replace(`[P${index + 1}]`, param.value.toString());

      selection.results.forEach(r => {
        r.label = r.label.replace(`[P${index + 1}]`, param.value.toString());
      });
    });
    return selection;
  }

  addSelection(selection: IndicatorSelection) {

    // replace tokens
    selection = this.selectionTokenReplacement(selection);

    // add to collection
    this.selections.push(selection);
    // TODO: save to cache

    // lookup config data
    const listing = this.listings.find(x => x.uiid == selection.uiid);

    this.api.getSelectionData(selection, listing)
      .subscribe({
        next: () => {

          // add needed charts
          if (selection.chartType == 'overlay') {
            this.addSelectionToOverlayChart(selection);
          }
          else {
            this.addSelectionToNewChart(selection, listing);
          };

        },
        error: (e: HttpErrorResponse) => { console.log(e); }
      });

    this.cacheSelections();
  }

  deleteSelection(ucid: string) {

    const selection = this.selections.find(x => x.ucid == ucid);

    const sx = this.selections.indexOf(selection, 0);
    this.selections.splice(sx, 1);

    if (selection.chartType == "overlay") {

      selection.results.forEach((result: IndicatorResult) => {
        const dx = this.chartOverlay.data.datasets.indexOf(result.dataset, 0);
        this.chartOverlay.data.datasets.splice(dx, 1);
      });
      this.updateOverlayAnnotations();
      this.chartOverlay.update();

    } else {
      const body = document.getElementById("main-content");
      const chart = document.getElementById(`${selection.ucid}-container`);
      body.removeChild(chart);
    }

    this.cacheSelections();
  }

  cacheSelections() {

    const selections = this.selections;

    // remove unsavable data
    selections.forEach((selection:IndicatorSelection)=>{
      selection.chart = undefined;
    });

    localStorage.setItem('selections', JSON.stringify(selections));
  }

  // CHARTS OPERATIONS
  addSelectionToOverlayChart(selection: IndicatorSelection) {

    // add selection
    selection.results.forEach((r: IndicatorResult) => {
      this.chartOverlay.data.datasets.push(r.dataset);
    });
    this.chartOverlay.update(); // ensures scales are drawn to correct size first
    this.updateOverlayAnnotations();
    this.chartOverlay.update();
  }

  addSelectionToNewChart(selection: IndicatorSelection, listing: IndicatorListing) {
    const chartConfig = this.baseOscillatorConfig();

    // initialize chart datasets
    chartConfig.data = {
      datasets: []
    };

    // chart configurations

    // add thresholds (reference lines)
    const qtyThresholds = listing.chartConfig.thresholds.length;

    listing.chartConfig?.thresholds?.forEach((threshold: ChartThreshold, index: number) => {

      const lineData: ScatterDataPoint[] = [];

      // compose threshold data
      selection.results[0].dataset.data.forEach((d: ScatterDataPoint) => {
        lineData.push({ x: d.x, y: threshold.value } as ScatterDataPoint);
      });

      const thresholdDataset: ChartDataset = {
        label: "threshold",
        type: 'line',
        data: lineData,
        yAxisID: 'yAxis',
        pointRadius: 0,
        borderWidth: 2.5,
        borderDash: threshold.style == "dash" ? [5, 2] : [],
        borderColor: threshold.color,
        backgroundColor: threshold.color,
        spanGaps: true,
        fill: threshold.fill == null ? false : {
          target: threshold.fill.target,
          above: threshold.fill.colorAbove,
          below: threshold.fill.colorBelow
        },
        order: index + 100
      };

      chartConfig.data.datasets.push(thresholdDataset);
    });

    // hide thresholds from tooltips
    chartConfig.options.plugins.tooltip.filter = (tooltipItem) =>
      (tooltipItem.datasetIndex > (qtyThresholds - 1));

    // y-scale
    chartConfig.options.scales.yAxis.min = listing.chartConfig?.minimumYAxis;
    chartConfig.options.scales.yAxis.max = listing.chartConfig?.maximumYAxis;

    // add selection
    selection.results.forEach((r: IndicatorResult) => {
      chartConfig.data.datasets.push(r.dataset);
    });

    // compose chart
    const myCanvas = document.createElement('canvas') as HTMLCanvasElement;
    myCanvas.id = selection.ucid;

    const container = document.createElement('div') as HTMLDivElement;
    container.id = `${selection.ucid}-container`;
    container.className = "chart-oscillator-container";
    container.appendChild(myCanvas);
    const body = document.getElementById("main-content");
    body.appendChild(container);

    if (selection.chart) selection.chart.destroy();
    selection.chart = new Chart(myCanvas.getContext("2d"), chartConfig);

    // annotations
    const xPos: ScaleValue = selection.chart.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = selection.chart.scales["yAxis"].getMinMax(false).max;

    const annotation: AnnotationOptions =
      this.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, -2, 1);
    selection.chart.options.plugins.annotation.annotations = { annotation };
    selection.chart.update();
  }

  updateOverlayAnnotations() {

    const xPos: ScaleValue = this.chartOverlay.scales["xAxis"].getMinMax(false).min;
    const yPos: ScaleValue = this.chartOverlay.scales["yAxis"].getMinMax(false).max;
    let adjY: number = 0;

    this.chartOverlay.options.plugins.annotation.annotations =
      this.selections
        .filter(x => x.chartType == 'overlay')
        .map((selection: IndicatorSelection, index: number) => {
          const annotation: AnnotationOptions =
            this.commonAnnotation(selection.label, selection.results[0].color, xPos, yPos, -2, adjY);
          annotation.id = "legend" + (index + 1).toString();
          adjY += 12;
          return annotation;
        });
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
      backgroundColor: 'rgba(33,33,33,0.5)',
      padding: 0,
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


  // helper functions
  getGuid(prefix: string = "chart"): string {
    return `${prefix}${Guid.create().toString().replace(/-/gi, "")}`;
  }

}
