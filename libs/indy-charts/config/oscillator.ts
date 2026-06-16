import { type CartesianScaleOptions, type ChartConfiguration, type ChartOptions } from "chart.js";

import { type ChartSettings } from "./types";
import { baseChartOptions } from "./common";

/**
 * Minimum number of y-axis ticks an oscillator pane must generate before the
 * first and last (boundary) labels are dropped.
 *
 * The boundary labels are normally suppressed because, with `ticks.mirror`, the
 * topmost/bottommost label can clip against the pane edge. But oscillator panes
 * are short (the docs use `aspect-ratio: 6`), so Chart.js often fits only two or
 * three gridlines. Dropping both ends there leaves zero or one visible label —
 * the "right axis isn't shown" symptom. Keep every label until the pane has
 * enough ticks to spare the bounds. See issue #495.
 */
const MIN_TICKS_TO_TRIM_BOUNDS = 4;

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
  if (options.scales?.["x"]) {
    options.scales["x"].display = false;
  }

  // format y-axis (helper context)
  if (!options.scales || !options.scales["y"]) return options;
  const y = options.scales["y"] as CartesianScaleOptions;

  // rescale labels
  y.ticks.callback = (value: string | number, index, values) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    const v = Math.abs(numValue);

    // Drop the first and last y-axis labels only when the pane has enough
    // gridlines to spare them; on short panes keep the bounds visible so the
    // axis range is still readable (issue #495).
    if (values.length >= MIN_TICKS_TO_TRIM_BOUNDS && (index === 0 || index === values.length - 1))
      return null;
    // otherwise, condense large/small display values
    else if (v > 10000000000) return Math.trunc(numValue / 1000000000) + "B";
    else if (v > 10000000) return Math.trunc(numValue / 1000000) + "M";
    else if (v > 10000) return Math.trunc(numValue / 1000) + "K";
    else if (v > 10) return Math.trunc(numValue);
    else if (v > 0.001) return Math.round((numValue + Number.EPSILON) * 100000) / 100000;
    else if (v > 0) return numValue.toExponential(2);
    else return Math.round((numValue + Number.EPSILON) * 100000000) / 100000000;
  };

  return options;
}
