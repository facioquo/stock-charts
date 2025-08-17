// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { OhlcElement } from "./ohlc-element";

/**
 * OHLC chart controller
 */
export class OhlcController extends FinancialController {
  static readonly id = "ohlc";

  updateElements(elements: any[], start: number, count: number, mode: any): void {
    const dataset = this.getDataset();
    const ruler = this._ruler || this._getRuler();
    const firstOpts = this.resolveDataElementOptions(start, mode);
    const sharedOptions = this.getSharedOptions(firstOpts);
    const includeOptions = this.includeOptions(mode, sharedOptions || {});

    for (let i = 0; i < count; i++) {
      const options = sharedOptions || this.resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        lineWidth: (dataset as any).lineWidth,
        armLength: (dataset as any).armLength,
        armLengthRatio: (dataset as any).armLengthRatio,
        color: (dataset as any).color
      };

      if (includeOptions) {
        properties.options = options;
      }
      this.updateElement(elements[i], i, properties, mode);
    }
  }

  static readonly defaults = merge({
    dataElementType: OhlcElement.id,
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }
  }, (Chart.defaults as any).financial);
}