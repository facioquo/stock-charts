import type { App } from "vue";

import { indyChartsVueOptionsKey } from "./context";
import { StockIndicatorChart } from "./stock-indicator-chart";
import type { IndyChartsVueOptions } from "./types";

export { StockIndicatorChart } from "./stock-indicator-chart";
export { getTestIdPrefix, slug, STOCK_INDICATOR_CHART_TESTID_PREFIX } from "./slug";
export type {
  IndyChartsVueApiOptions,
  IndyChartsVueDefaults,
  IndyChartsVueOptions,
  IndyChartsVueThemeOptions,
  StockIndicatorChartConfig,
  StockIndicatorChartPhase,
  StockIndicatorChartProps,
  StockIndicatorChartRegistry
} from "./types";

/**
 * Register indy-charts in a Vue 3 app (works in VitePress, Nuxt, or any Vue app).
 *
 * Call once in your app entry point (e.g. `.vitepress/theme/index.ts` or
 * `main.ts`) before any `<StockIndicatorChart>` component is mounted.
 */
export function setupIndyChartsForVue(app: App, options: IndyChartsVueOptions): void {
  app.provide(indyChartsVueOptionsKey, options);
  app.component("StockIndicatorChart", StockIndicatorChart);
}
