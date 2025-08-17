/**
 * OHLC controller for Chart.js financial charts
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";

/**
 * Controller for OHLC charts
 */
export class OhlcController extends FinancialController {
  static id = "ohlc";

  /**
   * Update elements with OHLC-specific properties
   */
  updateElements(elements: any[], start: number, count: number, mode: any): void {
    const dataset = this.getDataset();
    const ruler = this._ruler ?? this._getRuler();
    const firstOpts = this.resolveDataElementOptions(start, mode);
    const sharedOptions = this.getSharedOptions(firstOpts);
    const includeOptions = this.includeOptions(mode, sharedOptions ?? {});

    this.updateSharedOptions(sharedOptions ?? {}, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions ?? this.resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties: any = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth
      };

      if (includeOptions) {
        properties.options = options;
      }
      this.updateElement(elements[i], i, properties, mode);
    }
  }
}

// Set up defaults for OhlcController
OhlcController.defaults = merge(
  {
    dataElementType: "ohlc",
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }
  },
  (Chart.defaults as any).financial || {}
);
