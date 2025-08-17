// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// Registration mechanism for financial chart components

import { Chart } from "chart.js";
import { FinancialController } from "./financial-controller";
import { CandlestickController } from "./candlestick-controller";
import { CandlestickElement } from "./candlestick-element";
import { OhlcController } from "./ohlc-controller";
import { OhlcElement } from "./ohlc-element";

// Define financial element types for Chart.js defaults
interface FinancialElementDefaults {
  backgroundColors: {
    up: string;
    down: string;
    unchanged: string;
  };
  borderColors: {
    up: string;
    down: string;
    unchanged: string;
  };
}

interface CandlestickElementDefaults extends FinancialElementDefaults {
  borderWidth: number;
}

interface OhlcElementDefaults extends FinancialElementDefaults {
  lineWidth: number;
  armLength: number | null;
  armLengthRatio: number;
}

// Type-safe extensions to Chart.js defaults
declare module "chart.js" {
  interface DefaultsElements {
    financial?: FinancialElementDefaults;
    candlestick?: CandlestickElementDefaults;
    ohlc?: OhlcElementDefaults;
  }

  interface ChartTypeRegistry {
    financial: {
      chartOptions: unknown;
      datasetOptions: unknown;
      defaultDataPoint: unknown;
      metaExtensions: Record<string, never>;
      parsedDataType: unknown;
      scales: "linear";
    };
    candlestick: {
      chartOptions: unknown;
      datasetOptions: unknown;
      defaultDataPoint: unknown;
      metaExtensions: Record<string, never>;
      parsedDataType: unknown;
      scales: "linear";
    };
    ohlc: {
      chartOptions: unknown;
      datasetOptions: unknown;
      defaultDataPoint: unknown;
      metaExtensions: Record<string, never>;
      parsedDataType: unknown;
      scales: "linear";
    };
  }
}

// Default color configuration
const DEFAULT_COLORS = {
  backgroundColors: {
    up: "rgba(75, 192, 192, 0.5)",
    down: "rgba(255, 99, 132, 0.5)",
    unchanged: "rgba(201, 203, 207, 0.5)"
  },
  borderColors: {
    up: "rgb(75, 192, 192)",
    down: "rgb(255, 99, 132)",
    unchanged: "rgb(201, 203, 207)"
  }
};

// Registration flag to ensure idempotent registration
let isRegistered = false;

/**
 * Ensure financial chart components are registered with Chart.js
 * This function is idempotent - it can be called multiple times safely
 * Based on the reference implementation from chartjs-chart-financial
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return;
  }

  // Register all controllers and elements
  Chart.register(
    FinancialController,
    CandlestickController,
    CandlestickElement,
    OhlcController,
    OhlcElement
  );

  // Set up default financial element configuration
  const elementsDefaults = Chart.defaults.elements as unknown as Record<string, unknown>;

  // Base financial element defaults
  elementsDefaults.financial = DEFAULT_COLORS;

  // Candlestick-specific defaults
  elementsDefaults.candlestick = {
    ...DEFAULT_COLORS,
    borderWidth: 1
  };

  // OHLC-specific defaults
  elementsDefaults.ohlc = {
    ...DEFAULT_COLORS,
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8
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
