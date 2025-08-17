// Candlestick chart controller
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Chart, ChartComponent } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { CandlestickElement } from "./candlestick-element";

export class CandlestickController extends FinancialController {
  static readonly id = "candlestick";
  static readonly defaults: any;

  updateElements(
    elements: CandlestickElement[],
    start: number,
    count: number,
    mode: "default" | "resize" | "reset" | "none" | "hide" | "show" | "active"
  ): void {
    const me = this;
    const dataset = me.getDataset() as any;
    const ruler = me._ruler || me._getRuler();
    const firstOpts = me.resolveDataElementOptions(start, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);

    me.updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        color: dataset.color,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth
      };

      if (includeOptions) {
        properties.options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }
}

// Set up controller defaults
(CandlestickController as any).defaults = merge(
  {
    dataElementType: CandlestickElement.id
  },
  {}  // Will be merged with Chart.defaults.financial in registration
);

// Export component interface for registration
export const CandlestickControllerComponent: ChartComponent = CandlestickController as any;