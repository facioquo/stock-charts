/**
 * Candlestick Controller
 * 
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { Chart } from "chart.js";
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { CandlestickElement } from "./candlestick-element";

interface ColorConfig {
  up?: string;
  down?: string;
  unchanged?: string;
}

interface CandlestickDatasetProperties {
  label?: string;
  color?: ColorConfig;
  borderColor?: ColorConfig | string;
  borderWidth?: number;
}

/**
 * Controller for candlestick charts
 */
export class CandlestickController extends FinancialController {
  static id = "candlestick";
  
  static defaults = merge(
    {
      dataElementType: CandlestickElement.id
    },
    (Chart.defaults as any).financial || {}
  );

  updateElements(elements: any[], start: number, count: number, mode: any): void {
    const me = this;
    const dataset = me.getDataset() as CandlestickDatasetProperties;
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
        // Appearance
        color: dataset.color,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth
      };

      if (includeOptions) {
        (properties as any).options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }
}