import { Chart, ChartOptions } from "chart.js";

import { FinancialPalette } from "../types/financial.types";
import { ensureFinancialDefaults } from "../helpers/defaults";

interface CandlestickElementDefaults {
  color: FinancialPalette["candle"];
  borderColor: FinancialPalette["candleBorder"];
}

export function applyFinancialElementTheme(palette: FinancialPalette): void {
  ensureFinancialDefaults(palette);

  const candleDefaults = Chart.defaults.elements as unknown as {
    candlestick: CandlestickElementDefaults;
  };

  candleDefaults.candlestick.color = { ...palette.candle };
  candleDefaults.candlestick.borderColor = { ...palette.candleBorder };
}

/** Applies baseline performance-safe financial chart options. */
export function buildFinancialChartOptions(base: ChartOptions): ChartOptions {
  const options: ChartOptions = {
    ...base,
    plugins: {
      ...base.plugins,
      tooltip: base.plugins?.tooltip ? { ...base.plugins.tooltip } : undefined
    }
  };

  options.animation = false;
  if (options.plugins?.tooltip) {
    options.plugins.tooltip.intersect = false;
  }

  return options;
}
