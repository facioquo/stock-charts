// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// OhlcController - extends FinancialController for OHLC chart types

import { FinancialController } from "./financial-controller";
import type { ControllerWithInternals } from "./types";
import type { ControllerType } from "./types";

/**
 * OHLC (Open-High-Low-Close) Controller
 * Specialized controller for OHLC bar charts
 */
export class OhlcController extends FinancialController {
  static readonly id = "ohlc" as const;

  static override overrides = {
    ...FinancialController.overrides,
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }
  };

  /**
   * Update chart elements for OHLC display
   */
  updateElements(
    elements: Array<{ options?: Record<string, unknown> }>,
    start: number,
    count: number,
    mode: string
  ): void {
    const reset = mode === "reset";
    const ruler = (this as unknown as ControllerWithInternals)._getRuler();
    const sharedOptionsResult = (this as unknown as ControllerType)._getSharedOptions(start, mode);
    const { sharedOptions, includeOptions } = sharedOptionsResult as {
      sharedOptions?: Record<string, unknown>;
      includeOptions: boolean;
    };

    for (let i = start; i < start + count; i++) {
      const options =
        sharedOptions ?? (this as unknown as ControllerType).resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, reset, options);

      if (includeOptions) {
        baseProperties.options = options;
      }

      (this as unknown as ControllerType).updateElement(elements[i], i, baseProperties, mode);
    }
  }
}
