/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import { Chart } from 'chart.js';
import { CandlestickController } from './controllers/candlestick-controller';
import { OhlcController } from './controllers/ohlc-controller';
import { CandlestickElement } from './elements/candlestick-element';
import { OhlcElement } from './elements/ohlc-element';

let isRegistered = false;

/**
 * Ensures financial chart components are registered with Chart.js exactly once.
 * This function is idempotent - safe to call multiple times.
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return;
  }

  // Set up financial defaults
  const chartDefaults = Chart.defaults as any;
  chartDefaults.elements = chartDefaults.elements || {};
  chartDefaults.elements.financial = {
    color: {
      up: 'rgba(80, 160, 115, 1)',
      down: 'rgba(215, 85, 65, 1)',
      unchanged: 'rgba(90, 90, 90, 1)'
    }
  };

  // Set up candlestick element defaults
  chartDefaults.elements.candlestick = {
    ...chartDefaults.elements.financial,
    borderColor: chartDefaults.elements.financial.color.unchanged,
    borderWidth: 1
  };

  // Set up ohlc element defaults
  chartDefaults.elements.ohlc = {
    ...chartDefaults.elements.financial,
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8
  };

  // Register controllers and elements
  Chart.register(
    CandlestickController,
    OhlcController,
    CandlestickElement,
    OhlcElement
  );

  isRegistered = true;
}

/**
 * Check if financial charts are already registered
 */
export function isFinancialChartsRegistered(): boolean {
  return isRegistered;
}

/**
 * Reset registration state (primarily for testing)
 */
export function resetFinancialChartsRegistration(): void {
  isRegistered = false;
}