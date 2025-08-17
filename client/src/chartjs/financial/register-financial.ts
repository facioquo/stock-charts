/**
 * Financial Chart Registration System
 * 
 * Provides idempotent registration for financial chart types
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { Chart } from "chart.js";
import { CandlestickController } from "./candlestick-controller";
import { CandlestickElement } from "./candlestick-element";
import { OhlcController } from "./ohlc-controller";
import { OhlcElement } from "./ohlc-element";
import { DEFAULT_FINANCIAL_COLORS } from "./colors";

// Track registration state to ensure idempotency
let isRegistered = false;

/**
 * Initialize Chart.js financial element defaults
 */
function initializeFinancialDefaults(): void {
  // Set up global financial element defaults using safe property access
  const elements = Chart.defaults.elements as any;
  
  if (!elements.financial) {
    elements.financial = {
      color: {
        up: DEFAULT_FINANCIAL_COLORS.up,
        down: DEFAULT_FINANCIAL_COLORS.down,
        unchanged: DEFAULT_FINANCIAL_COLORS.unchanged
      }
    };
  }

  // Initialize candlestick defaults
  if (!elements.candlestick) {
    elements.candlestick = {
      ...elements.financial,
      borderColor: elements.financial.color.unchanged,
      borderWidth: 1
    };
  }

  // Initialize OHLC defaults
  if (!elements.ohlc) {
    elements.ohlc = {
      ...elements.financial,
      lineWidth: 2,
      armLength: null,
      armLengthRatio: 0.8
    };
  }

  // Set up shared financial chart defaults
  const defaults = Chart.defaults as any;
  if (!defaults.financial) {
    defaults.financial = {
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
          mode: "index"
        }
      }
    };
  }
}

/**
 * Register financial chart components with Chart.js
 * This function is idempotent - safe to call multiple times
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return; // Already registered, skip
  }

  try {
    // Initialize Chart.js defaults for financial elements
    initializeFinancialDefaults();

    // Register controllers and elements
    Chart.register(
      // Controllers
      CandlestickController,
      OhlcController,
      
      // Elements
      CandlestickElement,
      OhlcElement
    );

    // Mark as registered to prevent duplicate registration
    isRegistered = true;

    console.debug("Financial charts registered successfully");
  } catch (error) {
    console.error("Failed to register financial charts:", error);
    throw error;
  }
}

/**
 * Check if financial charts are already registered
 */
export function areFinancialChartsRegistered(): boolean {
  return isRegistered;
}

/**
 * Force re-registration (useful for testing or hot reload scenarios)
 * This should generally not be needed in production code
 */
export function forceReregisterFinancialCharts(): void {
  isRegistered = false;
  ensureFinancialChartsRegistered();
}

/**
 * Get list of registered financial chart types
 */
export function getRegisteredFinancialChartTypes(): string[] {
  if (!isRegistered) {
    return [];
  }
  
  const registeredTypes: string[] = [];
  
  // Check if controllers are registered by trying to access them
  try {
    if (Chart.registry.getController("candlestick")) {
      registeredTypes.push("candlestick");
    }
  } catch {
    // Controller not registered
  }
  
  try {
    if (Chart.registry.getController("ohlc")) {
      registeredTypes.push("ohlc");
    }
  } catch {
    // Controller not registered
  }
  
  return registeredTypes;
}

// Export all chart components for direct use if needed
export {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement
};