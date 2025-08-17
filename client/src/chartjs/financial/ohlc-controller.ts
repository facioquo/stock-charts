/**
 * OHLC Controller
 * 
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { OhlcElement } from "./ohlc-element";

interface ColorConfig {
  up?: string;
  down?: string;
  unchanged?: string;
}

interface OhlcDatasetProperties {
  label?: string;
  lineWidth?: number;
  armLength?: number;
  armLengthRatio?: number;
  color?: ColorConfig;
}

/**
 * Controller for OHLC charts
 */
export class OhlcController extends FinancialController {
  static id = "ohlc";
  
  static defaults = merge(
    {
      dataElementType: OhlcElement.id,
      datasets: {
        barPercentage: 1.0,
        categoryPercentage: 1.0
      }
    },
    (Chart.defaults as any).financial || {}
  );

  updateElements(elements: any[], start: number, count: number, mode: any): void {
    const me = this;
    const dataset = me.getDataset() as OhlcDatasetProperties;
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
        (properties as any).options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }
}