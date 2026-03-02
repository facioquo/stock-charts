import { CartesianScaleOptions, ChartConfiguration, ChartOptions, ScaleOptions } from "chart.js";

import { ChartSettings } from "./types";
import { baseChartOptions } from "./common";

export function baseOverlayConfig(
  volumeAxisSize: number,
  settings: ChartSettings
): ChartConfiguration {
  // Root chart type changed from "line" to "candlestick" so Chart.js
  // calculates y-axis bounds from OHLC values; using "line" caused empty
  // overlay (scale collapsed in production build).
  const config = {
    type: "candlestick",
    data: {
      datasets: []
    },
    options: baseOverlayOptions(volumeAxisSize, settings)
  } as unknown as ChartConfiguration;

  return config;
}

export function baseOverlayOptions(volumeAxisSize: number, settings: ChartSettings): ChartOptions {
  const options = baseChartOptions(settings);

  // format y-axis (helper context)
  if (!options.scales || !options.scales["y"]) return options;
  const y = options.scales["y"] as CartesianScaleOptions;

  // format primary y-axis labels
  y.ticks.callback = (value, index, values) => {
    // remove first and last y-axis labels
    if (index === 0 || index === values.length - 1) return null;
    // otherwise, add dollar sign
    else return "$" + value;
  };

  // define secondary y-axis for volume
  if (!options.scales) {
    options.scales = {} as ChartOptions["scales"];
  }
  (options.scales as Record<string, ScaleOptions>)["volumeAxis"] = {
    display: false,
    type: "linear",
    axis: "y",
    position: "left",
    beginAtZero: true,
    padding: 0,
    border: {
      display: false
    },
    max: volumeAxisSize
  } as ScaleOptions;

  return options;
}
