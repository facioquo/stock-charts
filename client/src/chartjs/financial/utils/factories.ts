/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import { ChartConfiguration, ChartDataset, ScatterDataPoint } from 'chart.js';
import { FinancialDataPoint } from '../financial-chart.registry';
import { FinancialColorScheme, DEFAULT_FINANCIAL_COLORS, generateVolumeColors } from './colors';

export interface CandlestickDatasetOptions {
  label?: string;
  data: FinancialDataPoint[];
  colorScheme?: FinancialColorScheme;
  borderWidth?: number;
}

export interface VolumeDatasetOptions {
  label?: string;
  data: ScatterDataPoint[];
  colorScheme?: FinancialColorScheme;
  yAxisID?: string;
}

export interface FinancialChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  volumeAxisSize?: number;
  scales?: {
    x?: any;
    y?: any;
    volume?: any;
  };
  plugins?: any;
}

/**
 * Creates a candlestick dataset with proper configuration
 */
export function createCandlestickDataset(options: CandlestickDatasetOptions): ChartDataset {
  const colorScheme = options.colorScheme || DEFAULT_FINANCIAL_COLORS;
  
  return {
    type: 'candlestick' as any,
    label: options.label || 'Price',
    data: options.data,
    color: colorScheme as any,
    borderColor: colorScheme as any,
    borderWidth: options.borderWidth || 1
  } as any;
}

/**
 * Creates a volume dataset with color-coded bars
 */
export function createVolumeDataset(options: VolumeDatasetOptions): ChartDataset {
  const colorScheme = options.colorScheme || DEFAULT_FINANCIAL_COLORS;
  
  // Extract OHLC data for color calculation
  const quotes = options.data.map(point => ({
    open: (point as any).o || 0,
    close: (point as any).c || 0
  }));
  
  const volumeColors = generateVolumeColors(quotes, colorScheme);
  
  return {
    type: 'bar',
    label: options.label || 'Volume',
    data: options.data,
    backgroundColor: volumeColors,
    borderColor: volumeColors,
    borderWidth: 0,
    yAxisID: options.yAxisID || 'volume'
  };
}

/**
 * Creates an OHLC dataset configuration
 */
export function createOhlcDataset(options: CandlestickDatasetOptions): ChartDataset {
  const colorScheme = options.colorScheme || DEFAULT_FINANCIAL_COLORS;
  
  return {
    type: 'ohlc' as any,
    label: options.label || 'OHLC',
    data: options.data,
    color: colorScheme as any,
    lineWidth: options.borderWidth || 2,
    armLengthRatio: 0.8
  } as any;
}

/**
 * Creates a complete financial chart configuration
 */
export function createFinancialChartConfig(
  candlestickData: FinancialDataPoint[],
  volumeData?: ScatterDataPoint[],
  options: FinancialChartOptions = {}
): ChartConfiguration {
  const datasets: ChartDataset[] = [
    createCandlestickDataset({
      label: 'Price',
      data: candlestickData
    })
  ];

  if (volumeData) {
    datasets.push(createVolumeDataset({
      label: 'Volume',
      data: volumeData,
      yAxisID: 'volume'
    }));
  }

  const volumeAxisSize = options.volumeAxisSize || 25;

  return {
    type: 'candlestick' as any,
    data: {
      datasets
    },
    options: {
      responsive: options.responsive ?? true,
      maintainAspectRatio: options.maintainAspectRatio ?? false,
      scales: {
        x: {
          type: 'timeseries',
          time: {
            displayFormats: {
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy'
            }
          },
          ...options.scales?.x
        },
        y: {
          type: 'linear',
          position: 'right',
          ...options.scales?.y
        },
        ...(volumeData && {
          volume: {
            type: 'linear',
            position: 'left',
            max: (context: any) => {
              const max = Math.max(...volumeData.map(d => d.y));
              return max * (100 / volumeAxisSize);
            },
            grid: {
              display: false
            },
            ticks: {
              display: false
            },
            ...options.scales?.volume
          }
        })
      },
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          mode: 'index',
          intersect: false
        },
        ...options.plugins
      }
    }
  };
}

/**
 * Converts quote data to financial data points
 */
export function convertToFinancialDataPoints(
  quotes: Array<{
    date: string | Date;
    open: number;
    high: number;
    low: number;
    close: number;
  }>
): FinancialDataPoint[] {
  return quotes.map(quote => ({
    x: new Date(quote.date).getTime(),
    o: quote.open,
    h: quote.high,
    l: quote.low,
    c: quote.close
  }));
}

/**
 * Converts quote data to volume data points
 */
export function convertToVolumeDataPoints(
  quotes: Array<{
    date: string | Date;
    volume: number;
  }>
): ScatterDataPoint[] {
  return quotes.map(quote => ({
    x: new Date(quote.date).getTime(),
    y: quote.volume
  }));
}