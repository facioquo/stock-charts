// Financial charts registration utility
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { CandlestickControllerComponent, CandlestickController } from "./candlestick-controller";
import { CandlestickElementComponent, CandlestickElement } from "./candlestick-element";
import { OhlcControllerComponent, OhlcController } from "./ohlc-controller";
import { OhlcElementComponent, OhlcElement } from "./ohlc-element";

// Track registration state to ensure idempotency
let isRegistered = false;

/**
 * Ensures financial chart components are registered with Chart.js.
 * This function is idempotent - it can be called multiple times safely.
 */
export function ensureFinancialChartsRegistered(): void {
  if (isRegistered) {
    return;
  }

  // Set up financial element defaults if not already present
  const globalOpts = Chart.defaults as any;
  if (!globalOpts.elements.financial) {
    globalOpts.elements.financial = {
      color: {
        up: "rgba(80, 160, 115, 1)",
        down: "rgba(215, 85, 65, 1)",
        unchanged: "rgba(90, 90, 90, 1)"
      }
    };
  }

  // Set up financial controller defaults
  if (!globalOpts.financial) {
    globalOpts.financial = {
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
              if (point && typeof point.o !== "undefined") {
                const { o, h, l, c } = point;
                return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
              }
              return ctx.formattedValue;
            }
          }
        }
      }
    };
  }

  // Set up element defaults
  if (!globalOpts.elements.candlestick) {
    globalOpts.elements.candlestick = merge({}, [globalOpts.elements.financial, {
      borderColor: globalOpts.elements.financial.color.unchanged,
      borderWidth: 1
    }]);
  }

  if (!globalOpts.elements.ohlc) {
    globalOpts.elements.ohlc = merge({}, [globalOpts.elements.financial, {
      lineWidth: 2,
      armLength: null,
      armLengthRatio: 0.8
    }]);
  }

  // Merge controller defaults with financial defaults
  (CandlestickController as any).defaults = merge(
    (CandlestickController as any).defaults,
    globalOpts.financial
  );

  (OhlcController as any).defaults = merge(
    (OhlcController as any).defaults,
    globalOpts.financial
  );

  // Register controllers and elements
  Chart.register(
    // Controllers
    CandlestickControllerComponent,
    OhlcControllerComponent,
    
    // Elements
    CandlestickElementComponent,
    OhlcElementComponent
  );

  isRegistered = true;
}

/**
 * Reset registration state (primarily for testing)
 */
export function resetFinancialRegistration(): void {
  isRegistered = false;
}