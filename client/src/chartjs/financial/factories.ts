// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { ChartConfiguration, ChartDataset } from "chart.js";
import { FinancialDataPoint, FinancialColorConfig } from "./types";
import { DEFAULT_FINANCIAL_COLORS } from "./colors";

/**
 * Options for creating a candlestick dataset
 */
export interface CandlestickDatasetOptions {
  label: string;
  data: FinancialDataPoint[];
  colors?: FinancialColorConfig;
  borderWidth?: number;
  borderColor?: string | FinancialColorConfig;
}

/**
 * Options for creating a volume dataset
 */
export interface VolumeDatasetOptions {
  label?: string;
  data: Array<{ x: number; y: number }>;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

/**
 * Creates a candlestick dataset configuration
 * @param options Dataset options
 * @returns Chart.js dataset configuration for candlestick chart
 */
export function createCandlestickDataset(options: CandlestickDatasetOptions): ChartDataset<'candlestick'> {
  return {
    type: 'candlestick',
    label: options.label,
    data: options.data,
    color: options.colors || DEFAULT_FINANCIAL_COLORS,
    borderColor: options.borderColor || (options.colors?.unchanged || DEFAULT_FINANCIAL_COLORS.unchanged),
    borderWidth: options.borderWidth ?? 1
  } as any;
}

/**
 * Creates a volume dataset configuration  
 * @param options Volume dataset options
 * @returns Chart.js dataset configuration for volume bars
 */
export function createVolumeDataset(options: VolumeDatasetOptions): ChartDataset<'bar'> {
  return {
    type: 'bar',
    label: options.label || 'Volume',
    data: options.data as any,
    backgroundColor: options.backgroundColor || 'rgba(108, 117, 125, 0.5)',
    borderColor: options.borderColor || 'rgba(108, 117, 125, 1)',
    borderWidth: options.borderWidth ?? 0,
    yAxisID: 'volume'
  } as any;
}

/**
 * Options for creating financial chart configuration
 */
export interface FinancialChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: boolean;
  scales?: {
    x?: any;
    y?: any;
    volume?: any;
  };
  plugins?: any;
}

/**
 * Creates a complete candlestick chart configuration
 * @param datasets Array of datasets (candlestick, volume, etc.)
 * @param options Chart configuration options
 * @returns Complete Chart.js configuration for financial chart
 */
export function createFinancialChartConfig(
  datasets: ChartDataset[],
  options: FinancialChartOptions = {}
): ChartConfiguration {
  return {
    type: 'line', // Base type, datasets specify their own types
    data: {
      datasets
    },
    options: {
      responsive: options.responsive !== false,
      maintainAspectRatio: options.maintainAspectRatio !== false,
      animation: options.animation as any,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          type: 'timeseries',
          time: {
            unit: 'day'
          },
          ...options.scales?.x
        },
        y: {
          type: 'linear',
          position: 'left',
          ...options.scales?.y
        },
        volume: {
          type: 'linear',
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          max: (context: any) => {
            // Auto-scale volume to use bottom 25% of chart
            const maxVolume = Math.max(...context.chart.data.datasets
              .filter((ds: any) => ds.yAxisID === 'volume')
              .flatMap((ds: any) => ds.data.map((d: any) => d.y || 0)));
            return maxVolume * 4; // 4x max volume = volume uses 25% of chart height
          },
          ...options.scales?.volume
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context: any) => {
              const point = context.parsed;
              if (context.dataset.type === 'candlestick') {
                const { o, h, l, c } = point;
                return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
              }
              return context.dataset.label + ': ' + context.formattedValue;
            }
          }
        },
        legend: {
          display: true
        },
        ...options.plugins
      }
    }
  };
}

/**
 * Performance optimized chart options for large datasets (5k-10k candles)
 */
export const PERFORMANCE_OPTIMIZED_OPTIONS: FinancialChartOptions = {
  animation: false,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: false // Disable tooltips for better performance
    }
  },
  scales: {
    x: {
      ticks: {
        maxTicksLimit: 10 // Limit number of x-axis labels
      }
    }
  }
};