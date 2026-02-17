/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";

import { FinancialPalette } from "../types/financial.types";

const defaultPalette: FinancialPalette = {
  candle: {
    up: "rgba(80, 160, 115, 1)",
    down: "rgba(215, 85, 65, 1)",
    unchanged: "rgba(90, 90, 90, 1)"
  },
  candleBorder: {
    up: "rgba(80, 160, 115, 1)",
    down: "rgba(215, 85, 65, 1)",
    unchanged: "rgba(90, 90, 90, 1)"
  },
  volume: {
    up: "rgba(80, 160, 115, 0.35)",
    down: "rgba(215, 85, 65, 0.35)",
    unchanged: "rgba(90, 90, 90, 0.35)"
  }
};

interface FinancialChartDefaults {
  financial?: {
    color: FinancialPalette["candle"];
  };
}

interface FinancialElementDefaults {
  financial?: {
    color: FinancialPalette["candle"];
  };
  candlestick?: {
    color: FinancialPalette["candle"];
    borderColor: FinancialPalette["candleBorder"] | string;
    borderWidth: number;
  };
  ohlc?: {
    color: FinancialPalette["candle"];
    lineWidth: number;
    armLength: number | null;
    armLengthRatio: number;
  };
}

export function setFinancialDefaults(palette: FinancialPalette = defaultPalette): void {
  const chartDefaults = Chart.defaults as unknown as FinancialChartDefaults;
  const elementDefaults = Chart.defaults.elements as unknown as FinancialElementDefaults;

  chartDefaults.financial = {
    color: { ...palette.candle }
  };

  elementDefaults.financial = {
    color: { ...palette.candle }
  };

  elementDefaults.ohlc = merge({}, [
    elementDefaults.financial,
    { lineWidth: 2, armLength: null, armLengthRatio: 0.8 }
  ]) as unknown as FinancialElementDefaults["ohlc"];

  elementDefaults.candlestick = merge({}, [
    elementDefaults.financial,
    {
      borderColor: { ...palette.candleBorder },
      borderWidth: 1
    }
  ]) as unknown as FinancialElementDefaults["candlestick"];
}
