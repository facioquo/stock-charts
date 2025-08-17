// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickController implementation

// Chart import removed - unused
import { merge } from "chart.js/helpers";
import { FinancialController } from "./financial-controller";
import { CandlestickElement } from "./candlestick-element";

/**
 * Candlestick chart controller
 */
export class CandlestickController extends FinancialController {
  static id = "candlestick";

  declare _ruler?: any;

  updateElements(elements: Element[], start: number, count: number, mode: string): void {
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
      this.updateElement(elements[i], i, properties, mode);
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
