/**
 * Registration system for financial chart components
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { Chart } from "chart.js";
import { CandlestickController } from "./controllers/candlestick-controller";
import { OhlcController } from "./controllers/ohlc-controller";
import { CandlestickElement } from "./elements/candlestick-element";
import { OhlcElement } from "./elements/ohlc-element";
import { FINANCIAL_COLORS } from "./colors";

/**
 * Static flag to prevent double registration
 */
let isRegistered = false;

/**
 * Ensures financial chart components are registered with Chart.js
 * This function is idempotent and can be called multiple times safely
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return;
  }

  // Set up global financial defaults by extending Chart.defaults
  (Chart.defaults as any).elements = {
    ...Chart.defaults.elements,
    financial: {
      color: {
        up: FINANCIAL_COLORS.UP,
        down: FINANCIAL_COLORS.DOWN,
        unchanged: FINANCIAL_COLORS.UNCHANGED
      }
    }
  };

  // Set up candlestick defaults
  (Chart.defaults as any).elements.candlestick = {
    ...(Chart.defaults as any).elements.financial,
    borderColor: FINANCIAL_COLORS.UNCHANGED,
    borderWidth: 1
  };

  // Set up OHLC defaults
  (Chart.defaults as any).elements.ohlc = {
    ...(Chart.defaults as any).elements.financial,
    borderColor: FINANCIAL_COLORS.UNCHANGED,
    borderWidth: 1
  };

  // Set up financial chart defaults
  (Chart.defaults as any).financial = {
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    },
    interaction: {
      intersect: false,
      mode: "index"
    },
    scales: {
      x: {
        type: "timeseries"
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
          label(ctx: any): string {
            const data = ctx.raw;
            if (data && typeof data === "object" && "o" in data) {
              return `O: ${data.o}  H: ${data.h}  L: ${data.l}  C: ${data.c}`;
            }
            return ctx.dataset.label + ": " + ctx.formattedValue;
          }
        }
      }
    }
  };

  // Register all financial chart components
  Chart.register(CandlestickController, OhlcController, CandlestickElement, OhlcElement);

  isRegistered = true;
}

/**
 * Checks if financial charts are already registered
 * @returns true if already registered, false otherwise
 */
export function isFinancialChartsRegistered(): boolean {
  return isRegistered;
}

/**
 * Resets the registration state (primarily for testing)
 * @internal
 */
export function resetRegistrationState(): void {
  isRegistered = false;
}
