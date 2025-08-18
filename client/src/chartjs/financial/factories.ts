// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// Dataset and configuration factory utilities

import { ChartDataset, ChartOptions, ScatterDataPoint } from "chart.js";
import type { FinancialDataPoint, FinancialColorConfig } from "./types";
import { CandlestickDataset } from "./financial-chart.registry";
import { getFinancialColors, createVolumeColors } from "./colors";

/**
 * Create a candlestick dataset with proper configuration
 */
export function buildCandlestickDataset(
  data: FinancialDataPoint[],
  options: {
    label?: string;
    colors?: FinancialColorConfig;
    borderWidth?: number;
  } = {}
): CandlestickDataset {
  const colors = options.colors ?? getFinancialColors();

  return {
    type: "candlestick",
    label: options.label ?? "Price",
    data,
    color: colors as unknown,
    borderColor: colors.unchanged,
    borderWidth: options.borderWidth ?? 1,
    yAxisID: "y"
  } as CandlestickDataset;
}

/**
 * Create an OHLC dataset with proper configuration
 */
export function buildOhlcDataset(
  data: FinancialDataPoint[],
  options: {
    label?: string;
    colors?: FinancialColorConfig;
    lineWidth?: number;
    armLengthRatio?: number;
  } = {}
): ChartDataset {
  const colors = options.colors ?? getFinancialColors();

  return {
    type: "ohlc",
    label: options.label ?? "Price",
    data: data as unknown[],
    borderColor: colors.unchanged,
    lineWidth: options.lineWidth ?? 2,
    armLengthRatio: options.armLengthRatio ?? 0.8,
    yAxisID: "y"
  } as ChartDataset;
}

/**
 * Create a volume dataset with color-coded bars
 */
export function buildVolumeDataset(
  volumeData: ScatterDataPoint[],
  priceData: FinancialDataPoint[],
  options: {
    label?: string;
    theme?: "light" | "dark" | "default";
    yAxisID?: string;
  } = {}
): ChartDataset {
  const volumeColors = createVolumeColors(priceData, options.theme);

  return {
    type: "bar",
    label: options.label ?? "Volume",
    data: volumeData,
    backgroundColor: volumeColors,
    borderColor: volumeColors,
    borderWidth: 0,
    yAxisID: options.yAxisID ?? "y1"
  };
}

/**
 * Create base financial chart options with dual y-axes
 */
export function buildFinancialChartOptions(
  volumeAxisSize: number = 25,
  options: {
    animation?: boolean;
    maintainAspectRatio?: boolean;
    responsive?: boolean;
  } = {}
): ChartOptions {
  return {
    responsive: options.responsive ?? true,
    maintainAspectRatio: options.maintainAspectRatio ?? false,
    animation: options.animation === true ? {} : false,
    scales: {
      x: {
        type: "timeseries",
        position: "bottom",
        adapters: {
          date: {}
        },
        time: {
          tooltipFormat: "MMM dd, yyyy",
          displayFormats: {
            day: "MMM dd",
            week: "MMM dd",
            month: "MMM yyyy"
          }
        },
        grid: {
          display: true
        }
      },
      y: {
        type: "linear",
        position: "right",
        grid: {
          display: true
        },
        beginAtZero: false
      },
      y1: {
        type: "linear",
        position: "left",
        max: function (ctx: {
          chart: { data: { datasets: { yAxisID?: string; data: ScatterDataPoint[] }[] } };
        }) {
          const chart = ctx.chart;
          const maxVolume = Math.max(
            ...chart.data.datasets
              .filter(d => d.yAxisID === "y1")
              .flatMap(d => d.data as ScatterDataPoint[])
              .map(p => (typeof p === "object" && "y" in p ? p.y : 0))
          );
          return maxVolume * (100 / volumeAxisSize);
        } as unknown as number,
        display: false,
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: "index",
        intersect: false
      }
    }
  };
}
