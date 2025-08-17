/**
 * Financial Chart Dataset and Configuration Factories
 * 
 * Based on chartjs-chart-financial patterns
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { ChartConfiguration, ChartDataset, ScatterDataPoint } from "chart.js";
import { FinancialDataPoint } from "./financial-chart.registry.d";
import {
  ENHANCED_FINANCIAL_COLORS,
  VOLUME_COLORS,
  createCandlestickColorCallback,
  createVolumeColorCallback,
  processFinancialDataColors,
  FinancialColorConfig
} from "./colors";

export interface CandlestickDatasetOptions {
  label?: string;
  data: FinancialDataPoint[];
  yAxisID?: string;
  order?: number;
  colors?: FinancialColorConfig;
}

export interface VolumeDatasetOptions {
  label?: string;
  data: ScatterDataPoint[];
  yAxisID?: string;
  order?: number;
  colors?: FinancialColorConfig;
}

export interface FinancialChartBaseOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  volumeAxisSize?: number;
}

/**
 * Creates a candlestick dataset with proper styling and color callbacks
 */
export function createCandlestickDataset(options: CandlestickDatasetOptions): ChartDataset {
  const colors = options.colors || ENHANCED_FINANCIAL_COLORS;
  
  return {
    type: "candlestick",
    label: options.label || "Price",
    data: options.data,
    yAxisID: options.yAxisID || "y",
    // Note: borderColor for financial charts is handled internally by the element
    order: options.order || 75
  };
}

/**
 * Creates a volume dataset with dynamic colors based on price direction
 */
export function createVolumeDataset(options: VolumeDatasetOptions): ChartDataset {
  const colors = options.colors || VOLUME_COLORS;
  
  // For volume, we need to determine colors based on corresponding price data
  // This assumes volume data corresponds to price data by index
  const volumeColors = options.data.map(() => colors.up); // Default to up color
  
  return {
    type: "bar",
    label: options.label || "Volume",
    data: options.data,
    yAxisID: options.yAxisID || "volumeAxis",
    backgroundColor: volumeColors,
    borderWidth: 0,
    order: options.order || 76
  };
}

/**
 * Creates a volume dataset with colors derived from financial data
 */
export function createVolumeDatasetFromFinancialData(
  volumeData: ScatterDataPoint[],
  financialData: FinancialDataPoint[],
  options: Partial<VolumeDatasetOptions> = {}
): ChartDataset {
  const colors = options.colors || VOLUME_COLORS;
  
  // Determine volume colors based on corresponding financial data
  const volumeColors = financialData.map(point => {
    return point.c >= point.o ? colors.up : colors.down;
  });
  
  return {
    type: "bar",
    label: options.label || "Volume",
    data: volumeData,
    yAxisID: options.yAxisID || "volumeAxis",
    backgroundColor: volumeColors,
    borderWidth: 0,
    order: options.order || 76
  };
}

/**
 * Creates base chart options for financial charts
 */
export function createFinancialChartBaseOptions(
  options: FinancialChartBaseOptions = {}
): Partial<ChartConfiguration["options"]> {
  return {
    responsive: options.responsive ?? true,
    maintainAspectRatio: options.maintainAspectRatio ?? false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        intersect: false,
        mode: "index",
        callbacks: {
          label(ctx: any) {
            const point = ctx.parsed;
            if (point && typeof point.o !== "undefined") {
              const { o, h, l, c } = point;
              return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
            }
            return ctx.formattedValue;
          }
        }
      }
    },
    scales: {
      x: {
        type: "timeseries",
        grid: {
          display: false
        }
      },
      y: {
        type: "linear",
        position: "right",
        grid: {
          display: true
        }
      },
      volumeAxis: {
        type: "linear",
        position: "right",
        max: options.volumeAxisSize || 0,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      }
    }
  };
}

/**
 * Creates a complete candlestick chart configuration
 */
export function createCandlestickChartConfig(
  priceData: FinancialDataPoint[],
  volumeData?: ScatterDataPoint[],
  baseOptions?: FinancialChartBaseOptions
): ChartConfiguration {
  const datasets: ChartDataset[] = [
    createCandlestickDataset({
      label: "Price",
      data: priceData,
      yAxisID: "y"
    })
  ];

  if (volumeData) {
    datasets.push(
      createVolumeDatasetFromFinancialData(volumeData, priceData, {
        label: "Volume",
        yAxisID: "volumeAxis"
      })
    );
  }

  return {
    type: "line", // Base type, actual types are specified per dataset
    data: {
      datasets
    },
    options: createFinancialChartBaseOptions(baseOptions)
  };
}

/**
 * Creates an OHLC chart configuration
 */
export function createOhlcChartConfig(
  priceData: FinancialDataPoint[],
  baseOptions?: FinancialChartBaseOptions
): ChartConfiguration {
  const datasets: ChartDataset[] = [
    {
      type: "ohlc",
      label: "Price",
      data: priceData,
      yAxisID: "y",
      order: 75
    }
  ];

  return {
    type: "line",
    data: {
      datasets
    },
    options: createFinancialChartBaseOptions(baseOptions)
  };
}

/**
 * Utility to add extra bars for future dates (common pattern in financial charts)
 */
export function addExtraFinancialBars(
  data: FinancialDataPoint[],
  extraBars: number = 7
): FinancialDataPoint[] {
  if (data.length === 0) return data;

  const lastPoint = data[data.length - 1];
  const lastDate = new Date(lastPoint.x);
  const extraData = [...data];

  for (let i = 1; i <= extraBars; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    extraData.push({
      x: nextDate.valueOf(),
      o: Number.NaN,
      h: Number.NaN,
      l: Number.NaN,
      c: Number.NaN
    });
  }

  return extraData;
}

/**
 * Utility to add extra volume bars
 */
export function addExtraVolumeBars(
  data: ScatterDataPoint[],
  extraBars: number = 7
): ScatterDataPoint[] {
  if (data.length === 0) return data;

  const lastPoint = data[data.length - 1];
  const lastDate = new Date(lastPoint.x);
  const extraData = [...data];

  for (let i = 1; i <= extraBars; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    
    extraData.push({
      x: nextDate.valueOf(),
      y: Number.NaN
    });
  }

  return extraData;
}