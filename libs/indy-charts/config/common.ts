import "chartjs-adapter-date-fns";
import { enUS } from "date-fns/locale";

import { type ChartOptions, type ScaleOptions } from "chart.js";

import { type ChartSettings } from "./types";
import { getThemeColors } from "./theme-colors";

export const FONT_FAMILY = "'Google Sans', Roboto, Verdana, Helvetica, Arial, sans-serif";

/** Tooltip filter: drops datasets flagged `skipTooltip` (thresholds, hidden `none` series). */
export function isTooltipReading(item: { dataset: object }): boolean {
  return !(item.dataset as { skipTooltip?: boolean }).skipTooltip;
}

export function baseChartOptions(settings: ChartSettings): ChartOptions {
  const options: ChartOptions = {
    // Index mode lists every series at the hovered bar, so overlays read against the candle.
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      title: {
        display: false
      },
      legend: {
        display: false
      },
      tooltip: {
        enabled: settings.showTooltips,
        mode: "index",
        intersect: false
      },
      annotation: {
        clip: false,
        annotations: {}
      }
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
    font: {
      family: FONT_FAMILY
    },
    scales: {
      x: defaultXAxisOptions(),
      y: {
        alignToPixels: true,
        display: true,
        type: "linear",
        axis: "y",
        position: "right",
        beginAtZero: false,
        ticks: {
          display: settings.showRightAxisLabels ?? true,
          mirror: true,
          color: getThemeColors(settings).text,
          font: {
            family: FONT_FAMILY,
            size: 12,
            lineHeight: 1
          },
          showLabelBackdrop: true,
          backdropColor: getThemeColors(settings).background,
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
          color: settings.isDarkTheme ? "#2E2E2E" : "#E0E0E0"
        }
      } as ScaleOptions
    }
  };

  // Assigned, not declared in the literal: a typed `filter` makes tsc resolve the augmented dataset union and reject the candlestick dataset in overlay-chart.
  Object.assign(options.plugins?.tooltip ?? {}, { filter: isTooltipReading });

  return options;
}

export function defaultXAxisOptions(): ScaleOptions {
  const options: ScaleOptions = {
    alignToPixels: true,
    display: false,
    offset: false,
    type: "timeseries",
    time: {
      unit: "day",
      tooltipFormat: "MMM d, yyyy"
    },
    adapters: {
      date: {
        locale: enUS
      }
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
      }
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
