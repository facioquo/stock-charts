import {
  type CartesianScaleOptions,
  type ChartConfiguration,
  type ChartOptions,
  type Tick
} from "chart.js";

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

/**
 * Suffixes for large axis labels, largest first, each taken once the biggest label
 * reaches its floor. K waits for 10,000 so a pane in the low thousands keeps plain
 * numbers rather than reading 0.2K to 0.8K.
 */
const AXIS_UNITS = [
  { floor: 1_000_000_000, divisor: 1_000_000_000, suffix: "B" },
  { floor: 1_000_000, divisor: 1_000_000, suffix: "M" },
  { floor: 10_000, divisor: 1_000, suffix: "K" }
] as const;

/** Whether the label at `index` is dropped as a bound; see {@link MIN_TICKS_TO_TRIM_BOUNDS}. */
function isTrimmedBound(index: number, count: number): boolean {
  return count >= MIN_TICKS_TO_TRIM_BOUNDS && (index === 0 || index === count - 1);
}

/**
 * The unit for every label on an axis: the largest one its biggest drawn label reaches,
 * so a pane spanning 3 billion reads 1B to 3B rather than 1000M to 3000M. A trimmed
 * bound is never drawn, so it does not count.
 */
function axisUnit(values: readonly Tick[]): (typeof AXIS_UNITS)[number] | undefined {
  const drawn = values.filter((_, index) => !isTrimmedBound(index, values.length));
  const largest = Math.max(0, ...drawn.map(tick => Math.abs(tick.value)));
  return AXIS_UNITS.find(unit => largest >= unit.floor);
}

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
    if (isTrimmedBound(index, values.length)) return null;

    // condense large values in one unit for the whole axis, so 5M and 15M are
    // not labelled 5000K and 15M
    const unit = axisUnit(values);
    if (unit && numValue !== 0)
      return `${Number((numValue / unit.divisor).toFixed(2))}${unit.suffix}`;
    // otherwise, condense small display values
    else if (v > 10) return Math.trunc(numValue);
    else if (v > 0.001) return Math.round((numValue + Number.EPSILON) * 100000) / 100000;
    else if (v > 0) return numValue.toExponential(2);
    else return Math.round((numValue + Number.EPSILON) * 100000000) / 100000000;
  };

  return options;
}
