// chartjs-chart-financial type augmentation
// based on https://github.com/chartjs/chartjs-chart-financial
// Simplified type definitions to avoid conflicts

// Financial data point interface
export interface FinancialDataPoint {
  x: number;
  o: number; // open
  h: number; // high  
  l: number; // low
  c: number; // close
}

// Export types but don't augment Chart.js module to avoid type conflicts
// The financial chart types will be registered at runtime
export type CandlestickDataset = {
  type: "candlestick";
  label?: string;
  data: FinancialDataPoint[];
  borderColor?: string | string[];
  borderWidth?: number;
  backgroundColor?: string | string[];
  color?: unknown;
  yAxisID?: string;
};
