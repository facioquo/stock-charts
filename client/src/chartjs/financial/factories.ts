/**
 * Factory utilities for creating financial chart datasets and options
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { ChartConfiguration, ChartDataset } from "chart.js";
import { FinancialDataPoint } from "./types/financial-data-point";
import {
  createDefaultFinancialColors,
  FinancialColorConfig
} from "./colors";

/**
 * Options for creating a candlestick dataset
 */
export interface CandlestickDatasetOptions {
  label?: string;
  data: FinancialDataPoint[];
  colors?: FinancialColorConfig;
  borderWidth?: number;
}

/**
 * Options for creating a volume dataset
 */
export interface VolumeDatasetOptions {
  label?: string;
  data: { x: number; y: number }[];
  colors?: FinancialColorConfig;
  ohlcData?: FinancialDataPoint[];
}

/**
 * Creates a candlestick dataset with appropriate styling
 */
export function createCandlestickDataset(options: CandlestickDatasetOptions): any {
  const colors = options.colors || createDefaultFinancialColors();

  return {
    type: "candlestick",
    label: options.label || "Price",
    data: options.data,
    color: colors,
    borderColor: colors.unchanged, // Default border color
    borderWidth: options.borderWidth || 1
  };
}

/**
 * Creates a volume dataset with dynamic coloring based on price movement
 */
export function createVolumeDataset(
  options: VolumeDatasetOptions
): ChartDataset<"bar", { x: number; y: number }[]> {
  const colors = options.colors || createDefaultFinancialColors();

  // Create color callback if OHLC data is provided for comparison
  let backgroundColor: string | ((ctx: any) => string);
  if (options.ohlcData) {
    backgroundColor = (ctx: any) => {
      const index = ctx.dataIndex;
      const ohlcPoint = options.ohlcData?.[index];
      if (ohlcPoint) {
        if (ohlcPoint.c > ohlcPoint.o) {
          return colors.up + "60"; // Add transparency
        } else if (ohlcPoint.c < ohlcPoint.o) {
          return colors.down + "60"; // Add transparency
        } else {
          return colors.unchanged + "60"; // Add transparency
        }
      }
      return colors.unchanged + "60";
    };
  } else {
    backgroundColor = colors.unchanged + "60";
  }

  return {
    type: "bar",
    label: options.label || "Volume",
    data: options.data,
    backgroundColor,
    borderWidth: 0
  };
}

/**
 * Creates base chart options for financial charts
 */
export function createFinancialChartOptions(): Partial<ChartConfiguration["options"]> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index"
    },
    scales: {
      x: {
        type: "timeseries",
        adapters: {
          date: {
            zone: "UTC"
          }
        },
        ticks: {
          source: "auto",
          maxRotation: 0,
          autoSkip: true
        }
      },
      y: {
        type: "linear",
        position: "right"
      }
    },
    plugins: {
      tooltip: {
        intersect: false,
        mode: "index",
        callbacks: {
          label: ctx => {
            if (ctx.dataset.type === "candlestick") {
              const data = ctx.raw as FinancialDataPoint;
              return `O: ${data.o}  H: ${data.h}  L: ${data.l}  C: ${data.c}`;
            }
            return ctx.dataset.label + ": " + ctx.formattedValue;
          }
        }
      }
    }
  };
}

/**
 * Creates chart options optimized for large datasets
 */
export function createLargeDatasetChartOptions(): Partial<ChartConfiguration["options"]> {
  const baseOptions = createFinancialChartOptions();

  return {
    ...baseOptions,
    animation: false,
    parsing: false,
    scales: {
      ...(baseOptions?.scales || {}),
      x: {
        ...(baseOptions?.scales?.x || {}),
        ticks: {
          ...(baseOptions?.scales?.x?.ticks || {}),
          maxTicksLimit: 10
        }
      }
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 0
      }
    }
  };
}
