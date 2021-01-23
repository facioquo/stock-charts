import { Injectable } from '@angular/core';
import { ChartConfiguration, CommonAxe, ChartYAxe } from 'chart.js';
import { CrosshairOptions } from 'chartjs-plugin-crosshair';
import 'chartjs-plugin-crosshair';

@Injectable()
export class ChartService {

    baseConfig(): ChartConfiguration {

        const commonXaxes = this.commonXAxes();
        const crosshairPluginOptions = this.crosshairPluginOptions();

        const config: ChartConfiguration = {

            options: {

                title: {
                    fontFamily: 'Roboto',
                    display: false
                },
                legend: {
                    display: false
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 0,
                        bottom: 0
                    }
                },
                maintainAspectRatio: false,
                responsive: true,
                // animation: {
                //     duration: 0
                // },
                // elements: {
                //     line: {
                //         tension: 0 // disables bezier curves
                //     }
                // },
                tooltips: {
                    enabled: true,
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    xAxes: commonXaxes,
                    yAxes: [
                        {
                            id: 'rightAxis',
                            display: true,
                            position: 'right',
                            ticks: {
                                autoSkip: true,
                                autoSkipPadding: 5,
                                beginAtZero: true,
                                mirror: true,
                                padding: -5,
                                fontSize: 10
                            },
                            gridLines: {
                                drawOnChartArea: true,
                                drawTicks: false
                            }
                        }
                    ]
                },
                plugins: {
                    crosshair: crosshairPluginOptions
                }
            }
        };

        return config;
    }


    baseOverlayConfig(): ChartConfiguration {

        const config = this.baseConfig();

        // scale y-axis
        config.options.scales.yAxes[0].ticks.beginAtZero = false;

        // aspect ratio
        config.options.maintainAspectRatio = true;

        // add dollar sign
        config.options.scales.yAxes[0].ticks.callback = (value, index, values) => '$' + value;

        // hide y-axis end label(s)
        config.options.scales.yAxes[0].afterTickToLabelConversion = (scaleInstance) => {
            // set the first and last tick to null so it does not display
            // note, ticks[0] is the last tick and ticks[length - 1] is the first
            // scaleInstance.ticks[0] = null;
            scaleInstance.ticks[scaleInstance.ticks.length - 1] = null;

            // need to do the same thing for this similiar array which is used internally
            // scaleInstance.ticksAsNumbers[0] = null;
            scaleInstance.ticksAsNumbers[scaleInstance.ticksAsNumbers.length - 1] = null;
        };

        // volume axis
        const volAxis: ChartYAxe = {
            id: 'volumeAxis',
            display: false,
            position: 'left',
            ticks: {
                display: false,
                beginAtZero: true,
                fontSize: 10
            }
        };

        config.options.scales.yAxes.push(volAxis);

        return config;
    }

    baseOscillatorConfig(): ChartConfiguration {

        const config = this.baseConfig();

        // remove x-axis
        config.options.scales.xAxes.forEach(s => s.display = false);

        return config;
    }

    commonXAxes(): CommonAxe[] {

        const axes: CommonAxe[] = [{
            id: 'first',
            display: false,
            type: 'category',
            ticks: {
                display: false,  // false for stock.indicators
                padding: 0,
                autoSkip: true,
                autoSkipPadding: 8,
                fontSize: 9,
                maxRotation: 0,
                minRotation: 0
            },
            gridLines: {
                drawOnChartArea: false,
                tickMarkLength: 2
            }
        }];

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
}
