import type { App } from "vue";

import { indyChartsVitePressOptionsKey } from "./context";
import { StockIndicatorChart } from "./stock-indicator-chart";
import type { IndyChartsVitePressOptions } from "./types";

export { StockIndicatorChart } from "./stock-indicator-chart";
export type {
  IndyChartsVitePressApiOptions,
  IndyChartsVitePressDefaults,
  IndyChartsVitePressOptions,
  IndyChartsVitePressThemeOptions,
  StockIndicatorChartConfig,
  StockIndicatorChartPhase,
  StockIndicatorChartProps,
  StockIndicatorChartRegistry
} from "./types";

export function setupIndyChartsForVitePress(app: App, options: IndyChartsVitePressOptions): void {
  app.provide(indyChartsVitePressOptionsKey, options);
  app.component("StockIndicatorChart", StockIndicatorChart);
}
