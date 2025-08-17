// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickController implementation

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { CandlestickElement } from "./candlestick-element";

/**
 * Candlestick chart controller
 */
export class CandlestickController extends FinancialController {
  static id = "candlestick";

  declare _ruler?: any;

  updateElements(elements: any[], start: number, count: number, mode: any): void {
    const me = this;
    const dataset = me.getDataset();
    const ruler = me._ruler || me._getRuler();
    const firstOpts = me.resolveDataElementOptions(start, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions || {});

    me.updateSharedOptions(sharedOptions || {}, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        color: (dataset as any).color,
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

// Set up defaults
CandlestickController.defaults = merge(
  {
    dataElementType: CandlestickElement.id
  },
  {}
);
