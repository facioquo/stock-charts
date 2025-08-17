// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickController implementation

// Chart import removed - unused
import { merge } from "chart.js/helpers";
import type { Element as ChartElement } from "chart.js";
import { FinancialController } from "./financial-controller";
import { CandlestickElement } from "./candlestick-element";

/**
 * Candlestick chart controller
 */
export class CandlestickController extends FinancialController {
  static id = "candlestick";

  declare _ruler?: any;

  updateElements(
    elements: unknown[], 
    start: number, 
    count: number, 
    mode: "default" | "resize" | "reset" | "none" | "hide" | "show" | "active"
  ): void {
    const dataset = this.getDataset();
    const ruler = this._ruler ?? this._getRuler();
    const firstOpts = this.resolveDataElementOptions(start, mode);
    const sharedOptions = this.getSharedOptions(firstOpts);
    const includeOptions = this.includeOptions(mode, sharedOptions ?? {});

    this.updateSharedOptions(sharedOptions ?? {}, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions ?? this.resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: (dataset as unknown as { label?: string }).label ?? "",
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        color: (dataset as unknown as { color?: unknown }).color,
        borderColor: (dataset as unknown as { borderColor?: unknown }).borderColor,
        borderWidth: (dataset as unknown as { borderWidth?: unknown }).borderWidth
      };

      if (includeOptions) {
        (properties as unknown as { options: unknown }).options = options;
      }
      this.updateElement(elements[i] as unknown as ChartElement, i, properties, mode);
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
