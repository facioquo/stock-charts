// chartjs-chart-financial type augmentation
// based on https://github.com/chartjs/chartjs-chart-financial
// Simplified type definitions to avoid conflicts

import type {
  BarControllerChartOptions,
  BarControllerDatasetOptions,
  CartesianScaleTypeRegistry
} from "chart.js";

// Financial data point interface
export interface FinancialDataPoint {
  x: number;
  o: number; // open
  h: number; // high  
  l: number; // low
  c: number; // close
}

// Simple module augmentation for candlestick chart type
// Temporarily commented out to resolve build issues
/*
declare module "chart.js" {
  interface ChartTypeRegistry {
    candlestick: {
      chartOptions: BarControllerChartOptions;
      datasetOptions: BarControllerDatasetOptions & {
        label?: string;
        borderColor?: string | string[];
        borderWidth?: number;
        backgroundColor?: string | string[];
      };
      defaultDataPoint: FinancialDataPoint;
      metaExtensions: Record<string, never>;
      parsedDataType: Record<string, unknown>;
      scales: string; // Change from keyof CartesianScaleTypeRegistry to string
    };
  }
}
*/
