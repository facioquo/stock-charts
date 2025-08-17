/**
 * Base financial controller for Chart.js financial charts
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * 
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { BarController, Chart, ChartMeta, Scale } from "chart.js";
import { clipArea, unclipArea } from "chart.js/helpers";

/**
 * Compute minimum sample size for financial charts
 */
function computeMinSampleSize(scale: Scale, pixels: number[]): number {
  let min = Number.POSITIVE_INFINITY;
  let prev: number, curr: number, i: number, ilen: number;

  for (i = 1, ilen = pixels.length; i < ilen; ++i) {
    min = Math.min(min, Math.abs(pixels[i] - pixels[i - 1]));
  }

  for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
    curr = scale.getPixelForTick(i);
    min = i > 0 ? Math.min(min, Math.abs(curr - prev)) : min;
    prev = curr;
  }

  return min;
}

/**
 * Base controller for financial chart types
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {
  declare _ruler?: any;
  
  /**
   * Get label and value for tooltips
   */
  getLabelAndValue(index: number): { label: string; value: string } {
    const parsed = this.getParsed(index);
    const axis = this._cachedMeta.iScale.axis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${this._cachedMeta.iScale.getLabelForValue(parsed[axis])}`,
      value
    };
  }

  /**
   * Get all parsed values for the axis
   */
  getAllParsedValues(): number[] {
    const meta = this._cachedMeta;
    const axis = meta.iScale.axis;
    const parsed = meta._parsed;
    const values: number[] = [];
    for (let i = 0; i < parsed.length; ++i) {
      values.push(parsed[i][axis]);
    }
    return values;
  }

  /**
   * Implement this ourselves since it doesn't handle high and low values
   * https://github.com/chartjs/Chart.js/issues/7328
   * @protected
   */
  getMinMax(scale: Scale): { min: number; max: number } {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed;
    const axis = meta.iScale.axis;

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < _parsed.length; i++) {
      const data = _parsed[i];
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

  /**
   * Get ruler for calculating bar positions
   * @protected
   */
  _getRuler(): any {
    const opts = this.options;
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale.axis;
    const pixels: number[] = [];
    
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(iScale.getPixelForValue(this.getParsed(i)[axis]));
    }
    
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    
    return {
      min,
      pixels,
      start: iScale._startPixel,
      end: iScale._endPixel,
      stackCount: this._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Calculate element properties for positioning
   * @protected
   */
  calculateElementProperties(
    index: number, 
    ruler: any, 
    reset: boolean, 
    options: any
  ): any {
    const vscale = this._cachedMeta.vScale;
    if (!vscale) {
      throw new Error("vScale is required for financial charts");
    }
    
    const base = vscale.getBasePixel();
    const ipixels = (this as any)._calculateBarIndexPixels(index, ruler, options);
    const data = this.chart.data.datasets[this.index].data[index] as any;
    const open = vscale.getPixelForValue(data.o);
    const high = vscale.getPixelForValue(data.h);
    const low = vscale.getPixelForValue(data.l);
    const close = vscale.getPixelForValue(data.c);

    return {
      base: reset ? base : low,
      x: ipixels.center,
      y: (low + high) / 2,
      width: ipixels.size,
      open,
      high,
      low,
      close
    };
  }

  /**
   * Draw the financial chart elements
   */
  draw(): void {
    const chart = this.chart;
    const rects = this._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea);
    for (let i = 0; i < rects.length; ++i) {
      (rects[i] as any).draw(chart.ctx);
    }
    unclipArea(chart.ctx);
  }
}