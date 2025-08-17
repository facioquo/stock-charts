/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import { Chart } from 'chart.js';
import { merge } from 'chart.js/helpers';
import { FinancialController } from './financial-controller';
import { CandlestickElement } from '../elements/candlestick-element';

export class CandlestickController extends FinancialController {
  static id = 'candlestick';
  static defaults = {
    dataElementType: CandlestickElement.id
  };

  updateElements(
    elements: any[], 
    start: number, 
    count: number, 
    mode: any
  ): void {
    const me = this;
    const dataset = me.getDataset();
    const ruler = (me as any)._ruler || me._getRuler();
    const firstOpts = (me as any).resolveDataElementOptions(start, mode);
    const sharedOptions = (me as any).getSharedOptions(firstOpts);
    const includeOptions = (me as any).includeOptions(mode, sharedOptions);

    (me as any).updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions || (me as any).resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === 'reset', options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || '',
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        color: (dataset as any).color,
        borderColor: (dataset as any).borderColor,
        borderWidth: (dataset as any).borderWidth
      };

      if (includeOptions) {
        properties.options = options;
      }
      (me as any).updateElement(elements[i], i, properties, mode);
    }
  }
}