/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import { Chart } from 'chart.js';
import { merge } from 'chart.js/helpers';
import { FinancialController } from './financial-controller';
import { OhlcElement } from '../elements/ohlc-element';

export class OhlcController extends FinancialController {
  static id = 'ohlc';
  static defaults = {
    dataElementType: OhlcElement.id,
    datasets: {
      barPercentage: 1.0,
      categoryPercentage: 1.0
    }
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

    for (let i = 0; i < count; i++) {
      const options = sharedOptions || (me as any).resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === 'reset', options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || '',
        lineWidth: (dataset as any).lineWidth,
        armLength: (dataset as any).armLength,
        armLengthRatio: (dataset as any).armLengthRatio,
        color: (dataset as any).color
      };

      if (includeOptions) {
        properties.options = options;
      }
      (me as any).updateElement(elements[i], i, properties, mode);
    }
  }
}