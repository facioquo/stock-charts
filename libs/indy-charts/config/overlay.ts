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

  options.scales ??= {};

  const y = options.scales["y"] as CartesianScaleOptions | undefined;
  if (y) {
    y.ticks.callback = (value, index, values) => {
      if (index === 0 || index === values.length - 1) return null;
      return "$" + value;
    };
  }

  // define secondary y-axis for volume
  options.scales["volumeAxis"] = {
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
