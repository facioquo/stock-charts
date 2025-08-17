// OHLC (Open-High-Low-Close) chart controller
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Chart, ChartComponent } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { OhlcElement } from "./ohlc-element";

export class OhlcController extends FinancialController {
  static readonly id = "ohlc";
  static readonly defaults: any;

  updateElements(
    elements: OhlcElement[],
    start: number,
    count: number,
    mode: "default" | "resize" | "reset" | "none" | "hide" | "show" | "active"
  ): void {
    const me = this;
    const dataset = me.getDataset() as any;
    const ruler = me._ruler || me._getRuler();
    const firstOpts = me.resolveDataElementOptions(start, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions || {});

    for (let i = 0; i < count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        lineWidth: dataset.lineWidth,
        armLength: dataset.armLength,
        armLengthRatio: dataset.armLengthRatio,
        color: dataset.color
      };

      if (includeOptions) {
        properties.options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }
}

// Set up controller defaults
(OhlcController as any).defaults = merge(
  {
    dataElementType: OhlcElement.id,
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }
  },
  {}  // Will be merged with Chart.defaults.financial in registration
);

// Export component interface for registration
export const OhlcControllerComponent: ChartComponent = OhlcController as any;