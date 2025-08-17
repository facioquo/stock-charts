// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// Registration mechanism for financial chart components

import { Chart } from "chart.js";
import { FinancialController } from "./financial-controller";
import { CandlestickController } from "./candlestick-controller";
import { CandlestickElement } from "./candlestick-element";
import { DEFAULT_FINANCIAL_COLORS } from "./colors";

// Define financial element types for Chart.js defaults
interface FinancialElementDefaults {
  color: {
    up: string;
    down: string;
    unchanged: string;
  };
}

interface CandlestickElementDefaults extends FinancialElementDefaults {
  borderColor: string | Record<string, string>;
  borderWidth: number;
}

// Type-safe extensions to Chart.js defaults
declare module "chart.js" {
  interface DefaultsElements {
    financial?: FinancialElementDefaults;
    candlestick?: CandlestickElementDefaults;
  }

  interface ChartTypeRegistry {
    financial: {
      chartOptions: unknown;
      datasetOptions: unknown;
      defaultDataPoint: unknown;
      metaExtensions: Record<string, never>;
      parsedDataType: unknown;
      scales: string;
    };
  }
}

// Registration flag to ensure idempotent registration
let isRegistered = false;

/**
 * Ensure financial chart components are registered with Chart.js
 * This function is idempotent - it can be called multiple times safely
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return;
  }

  // Set up default financial element configuration
  (Chart.defaults.elements as unknown as Record<string, unknown>).financial = {
    color: DEFAULT_FINANCIAL_COLORS
  };

  // Register controllers and elements
  Chart.register(FinancialController, CandlestickController, CandlestickElement);

  // Set up Chart.js defaults for financial charts
  (Chart.defaults as unknown as Record<string, unknown>).financial = {
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

  // Set up candlestick-specific defaults
  const elementsDefaults = Chart.defaults.elements as unknown as Record<string, unknown>;
  const financialDefaults = elementsDefaults.financial as FinancialElementDefaults;
  elementsDefaults.candlestick = {
    ...financialDefaults,
    borderColor: financialDefaults.color.unchanged,
    borderWidth: 1
  };

  isRegistered = true;
}

/**
 * Check if financial charts are already registered
 */
export function isFinancialChartsRegistered(): boolean {
  return isRegistered;
}

/**
 * Reset registration state (for testing purposes)
 */
export function resetFinancialChartsRegistration(): void {
  isRegistered = false;
}
