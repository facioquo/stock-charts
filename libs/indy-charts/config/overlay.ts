import {
  type CartesianScaleOptions,
  type ChartConfiguration,
  type ChartOptions,
  type ScaleOptions
} from "chart.js";

import { type ChartSettings } from "./types";
import { baseChartOptions, FONT_FAMILY } from "./common";
import { getThemeColors } from "./theme-colors";

/**
 * Highest volume the scale labels, as a fraction of the axis max. The axis max
 * is 20x the mean bar, so this caps labels at 2.5x the mean: inside the volume
 * band at the foot of the price pane, clear of the price labels above it.
 */
const VOLUME_LABEL_CEILING = 1 / 8;

const compactVolume = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

/** Rounds `value` down to 1, 2, or 5 times a power of ten. */
function niceFloor(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const fraction = value / magnitude;
  const nice = fraction >= 5 ? 5 : fraction >= 2 ? 2 : 1;
  return nice * magnitude;
}

/**
 * One round volume level within the band the bars occupy. Measured from the
 * zero baseline it gives the bars a readable quantity, and a single label keeps
 * that short band from crowding.
 */
export function volumeTickValues(axisMax: number): number[] {
  const ceiling = axisMax * VOLUME_LABEL_CEILING;
  if (!Number.isFinite(ceiling) || ceiling <= 0) return [];

  return [niceFloor(ceiling)];
}

/** Abbreviated volume label, such as `12M`. */
export function formatVolume(value: number): string {
  return compactVolume.format(value);
}

export function baseOverlayConfig(
  volumeAxisSize: number,
  settings: ChartSettings
): ChartConfiguration {
  // Root chart type changed from "line" to "candlestick" so Chart.js
  // calculates y-axis bounds from OHLC values; using "line" caused empty
  // overlay (scale collapsed in production build).
  const config: ChartConfiguration = {
    type: "candlestick",
    data: {
      datasets: []
    },
    options: baseOverlayOptions(volumeAxisSize, settings)
  };

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

  // Secondary y-axis for volume. Its labels sit in the right-hand column with
  // the price labels, mirrored inside the plot, so the axis takes no width.
  const colors = getThemeColors(settings);
  options.scales["volumeAxis"] = {
    display: settings.showRightAxisLabels ?? true,
    type: "linear",
    axis: "y",
    position: "right",
    beginAtZero: true,
    padding: 0,
    border: {
      display: false
    },
    // No tick marks either, or the axis reserves their length beside the plot.
    grid: {
      display: false,
      drawTicks: false
    },
    ticks: {
      mirror: true,
      color: colors.text,
      font: {
        family: FONT_FAMILY,
        size: 12,
        lineHeight: 1
      },
      showLabelBackdrop: true,
      backdropColor: colors.background,
      backdropPadding: {
        top: 0,
        left: 5,
        bottom: 0,
        right: 0
      },
      padding: 0,
      callback: value => formatVolume(Number(value))
    },
    afterBuildTicks: scale => {
      scale.ticks = volumeTickValues(scale.max).map(value => ({ value }));
    },
    max: volumeAxisSize
  } as ScaleOptions;

  return options;
}
