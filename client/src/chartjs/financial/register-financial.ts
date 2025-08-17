// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { Chart } from "chart.js";
import { CandlestickController } from "./candlestick-controller";
import { CandlestickElement } from "./candlestick-element";
import { OhlcController } from "./ohlc-controller";
import { OhlcElement } from "./ohlc-element";
import { DEFAULT_FINANCIAL_COLORS } from "./colors";

let isRegistered = false;

/**
 * Registers financial chart components with Chart.js
 * This function is idempotent - it can be called multiple times safely
 * @returns true if components were registered on this call, false if already registered
 */
export function ensureFinancialChartsRegistered(): boolean {
  if (isRegistered) {
    return false;
  }

  // Set up global financial element defaults
  (Chart.defaults.elements as any).financial = {
    color: DEFAULT_FINANCIAL_COLORS
  };

  // Set up candlestick-specific defaults
  (Chart.defaults.elements as any).candlestick = {
    borderColor: DEFAULT_FINANCIAL_COLORS.unchanged,
    borderWidth: 1,
    color: DEFAULT_FINANCIAL_COLORS
  };

  // Set up OHLC-specific defaults
  (Chart.defaults.elements as any).ohlc = {
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8,
    color: DEFAULT_FINANCIAL_COLORS
  };

  // Set up financial chart defaults
  (Chart.defaults as any).financial = {
    label: "",
    parsing: false,
    hover: {
      mode: "label"
    },
    datasets: {
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      animation: {
        numbers: {
          type: "number",
          properties: ["x", "y", "base", "width", "open", "high", "low", "close"]
        }
      }
    },
    plugins: {
      tooltip: {
        intersect: false,
        mode: "index",
        callbacks: {
          label(ctx: any) {
            const point = ctx.parsed;
            
            // Handle regular data points (not financial)
            if (point.y !== undefined && point.o === undefined) {
              return (Chart.defaults as any).plugins.tooltip.callbacks.label.call(this, ctx);
            }
            
            // Handle financial data points
            const { o, h, l, c } = point;
            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };

  // Register the controllers and elements
  Chart.register(
    CandlestickController,
    CandlestickElement,
    OhlcController,
    OhlcElement
  );

  isRegistered = true;
  return true;
}

/**
 * Gets the registration status
 * @returns true if financial charts are registered, false otherwise
 */
export function isFinancialChartsRegistered(): boolean {
  return isRegistered;
}

/**
 * Force re-registration (for testing purposes)
 * @internal
 */
export function resetFinancialChartsRegistration(): void {
  isRegistered = false;
}