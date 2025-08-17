// Financial chart dataset factories and utilities
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { ChartDataset, ScatterDataPoint } from "chart.js";
import { FinancialDataPoint } from "./types";
import { FINANCIAL_COLORS, createFinancialColorCallback, createVolumeColors } from "./colors";

/**
 * Default chart options for financial charts with performance optimizations
 */
export const FINANCIAL_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false, // Disable for better performance with large datasets
  parsing: false,   // Disable parsing for better performance
  interaction: {
    mode: "index" as const,
    intersect: false
  },
  plugins: {
    tooltip: {
      mode: "index" as const,
      intersect: false,
      callbacks: {
        label: (context: any) => {
          const point = context.parsed;
          if (point && typeof point.o !== "undefined") {
            const { o, h, l, c } = point;
            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
          return context.formattedValue;
        }
      }
    },
    legend: {
      display: false // Usually hidden for financial charts
    }
  },
  scales: {
    x: {
      type: "timeseries" as const,
      time: {
        displayFormats: {
          day: "MMM dd",
          week: "MMM dd",
          month: "MMM yyyy"
        }
      },
      grid: {
        display: false
      }
    },
    y: {
      position: "right" as const,
      grid: {
        color: "rgba(0,0,0,0.1)"
      }
    }
  }
} as const;

/**
 * Creates a candlestick dataset configuration
 */
export function createCandlestickDataset(
  data: FinancialDataPoint[],
  options: {
    label?: string;
    colors?: {
      up?: string;
      down?: string;
      unchanged?: string;
    };
    borderColors?: {
      up?: string;
      down?: string;
      unchanged?: string;
    };
    borderWidth?: number;
  } = {}
): ChartDataset<"candlestick"> {
  const colors = {
    up: options.colors?.up || FINANCIAL_COLORS.CANDLESTICK.up,
    down: options.colors?.down || FINANCIAL_COLORS.CANDLESTICK.down,
    unchanged: options.colors?.unchanged || FINANCIAL_COLORS.CANDLESTICK.unchanged
  };

  const borderColors = {
    up: options.borderColors?.up || colors.up,
    down: options.borderColors?.down || colors.down,
    unchanged: options.borderColors?.unchanged || colors.unchanged
  };

  return {
    type: "candlestick",
    label: options.label || "Price",
    data,
    color: colors,
    borderColor: borderColors,
    borderWidth: options.borderWidth || 1
  };
}

/**
 * Creates an OHLC dataset configuration
 */
export function createOhlcDataset(
  data: FinancialDataPoint[],
  options: {
    label?: string;
    colors?: {
      up?: string;
      down?: string;
      unchanged?: string;
    };
    lineWidth?: number;
    armLength?: number | null;
    armLengthRatio?: number;
  } = {}
): ChartDataset<"ohlc"> {
  const colors = {
    up: options.colors?.up || FINANCIAL_COLORS.CANDLESTICK.up,
    down: options.colors?.down || FINANCIAL_COLORS.CANDLESTICK.down,
    unchanged: options.colors?.unchanged || FINANCIAL_COLORS.CANDLESTICK.unchanged
  };

  return {
    type: "ohlc",
    label: options.label || "OHLC",
    data,
    color: colors,
    lineWidth: options.lineWidth || 2,
    armLength: options.armLength || null,
    armLengthRatio: options.armLengthRatio || 0.8
  };
}

/**
 * Creates a volume dataset configuration that works with financial data
 */
export function createVolumeDataset(
  priceData: FinancialDataPoint[],
  volumeData: ScatterDataPoint[],
  options: {
    label?: string;
    yAxisID?: string;
  } = {}
): ChartDataset<"bar"> {
  const volumeColors = createVolumeColors(priceData);

  return {
    type: "bar",
    label: options.label || "Volume",
    data: volumeData,
    backgroundColor: volumeColors,
    borderColor: volumeColors,
    borderWidth: 0,
    yAxisID: options.yAxisID || "volume",
    barPercentage: 1.0,
    categoryPercentage: 1.0
  };
}

/**
 * Processes financial quote data into Chart.js compatible formats
 */
export function processFinancialData(quotes: Array<{
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}>): {
  priceData: FinancialDataPoint[];
  volumeData: ScatterDataPoint[];
} {
  const priceData: FinancialDataPoint[] = [];
  const volumeData: ScatterDataPoint[] = [];

  quotes.forEach(quote => {
    const timestamp = new Date(quote.date).getTime();
    
    priceData.push({
      x: timestamp,
      o: quote.open,
      h: quote.high,
      l: quote.low,
      c: quote.close
    });

    if (quote.volume !== undefined) {
      volumeData.push({
        x: timestamp,
        y: quote.volume
      });
    }
  });

  return { priceData, volumeData };
}

/**
 * Creates chart options with volume axis configuration
 */
export function createFinancialChartOptions(
  volumeAxisSize: number = 20,
  customOptions: any = {}
): any {
  const baseOptions = { ...FINANCIAL_CHART_OPTIONS };
  
  // Add volume axis configuration
  const volumeOptions = {
    scales: {
      ...baseOptions.scales,
      volume: {
        type: "linear" as const,
        position: "right" as const,
        max: (context: any) => {
          const chart = context.chart;
          const mainAxis = chart.scales.y;
          return mainAxis.max * (volumeAxisSize / 100);
        },
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    }
  };

  // Merge with custom options
  return {
    ...baseOptions,
    ...volumeOptions,
    ...customOptions,
    scales: {
      ...volumeOptions.scales,
      ...customOptions.scales
    }
  };
}