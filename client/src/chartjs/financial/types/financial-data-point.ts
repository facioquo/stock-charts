/**
 * Financial chart data point interface
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * 
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

export interface FinancialDataPoint {
  /**
   * X-axis value (typically timestamp or date)
   */
  x: number;
  
  /**
   * Opening price
   */
  o: number;
  
  /**
   * High price
   */
  h: number;
  
  /**
   * Low price
   */
  l: number;
  
  /**
   * Closing price
   */
  c: number;
}

export interface FinancialParsedData {
  /**
   * Custom data property for Chart.js internal use
   */
  _custom?: unknown;
}