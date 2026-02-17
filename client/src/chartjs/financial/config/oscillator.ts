import { CartesianScaleOptions, ChartConfiguration, ChartOptions } from "chart.js";

import { ChartSettings } from "./types";
import { baseChartOptions } from "./common";

export function baseOscillatorConfig(settings: ChartSettings): ChartConfiguration {
  const config: ChartConfiguration = {
    type: "line",
    data: {
      datasets: []
    },
    options: baseOscillatorOptions(settings)
  };

  return config;
}

export function baseOscillatorOptions(settings: ChartSettings): ChartOptions {
  const options = baseChartOptions(settings);

  // remove x-axis
  if (options.scales?.x) {
    options.scales.x.display = false;
  }

  // format y-axis (helper context)
  if (!options.scales || !options.scales.y) return options;
  const y = options.scales.y as CartesianScaleOptions;

  // rescale labels
  y.ticks.callback = (value: number, index, values) => {
    const v = Math.abs(value);

    // remove first and last y-axis labels
    if (index === 0 || index === values.length - 1) return null;
    // otherwise, condense large/small display values
    else if (v > 10000000000) return Math.trunc(value / 1000000000) + "B";
    else if (v > 10000000) return Math.trunc(value / 1000000) + "M";
    else if (v > 10000) return Math.trunc(value / 1000) + "K";
    else if (v > 10) return Math.trunc(value);
    else if (v > 0) return Math.round((value + Number.EPSILON) * 10) / 10;
    else if (v > 0.001) return Math.round((value + Number.EPSILON) * 100000) / 100000;
    else return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
  };

  return options;
}
