import {
  BarElement,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeSeriesScale,
  Tooltip
} from "chart.js";
import AnnotationPlugin from "chartjs-plugin-annotation";

import { CandlestickController } from "./controllers/candlestick.controller";
import { OhlcController } from "./controllers/ohlc.controller";
import { CandlestickElement } from "./elements/candlestick.element";
import { OhlcElement } from "./elements/ohlc.element";
import { ensureFinancialDefaults } from "./helpers/defaults";

export const financialRegisterables = [
  CandlestickController,
  OhlcController,
  LineController,
  Tooltip,
  BarElement,
  CandlestickElement,
  OhlcElement,
  LineElement,
  PointElement,
  AnnotationPlugin,
  Filler,
  LinearScale,
  TimeSeriesScale
] as const;

let registered = false;

/**
 * Registers financial chart controllers/elements and required dependencies once.
 *
 * Derived from chartjs-chart-financial and adapted for Chart.js v4 + TypeScript.
 */
export function ensureFinancialChartsRegistered(): void {
  if (registered) return;

  ensureFinancialDefaults();
  Chart.register(...financialRegisterables);
  registered = true;
}

/** Internal test hook. */
export function __resetFinancialChartsRegistrationForTests(): void {
  registered = false;
}
