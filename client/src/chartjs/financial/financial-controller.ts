/**
 * Financial Controller Base Class
 * 
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { BarController, Chart, defaults } from "chart.js";
import { clipArea, unclipArea, isNullOrUndef } from "chart.js/helpers";

export interface FinancialDataPoint {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

interface FinancialElementProperties {
  base: number;
  x: number;
  y: number;
  width: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 */
function computeMinSampleSize(scale: any, pixels: number[]): number {
  let min = scale._length;
  let prev: number = 0;
  let curr: number;
  let i: number, ilen: number;

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
 * Base controller for financial charts (candlestick, OHLC)
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export abstract class FinancialController extends BarController {
  declare _ruler?: any; // Internal ruler cache
  declare options: any; // Chart options
  declare _ctx: CanvasRenderingContext2D; // Chart context

  static overrides = {
    label: "",
    parsing: false,
    hover: {
      mode: "label"
    },
    datasets: {
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      animation: {
        numbers: {
          type: "number",
          properties: ["x", "y", "base", "width", "open", "high", "low", "close"]
        }
      }
    },
    plugins: {
      tooltip: {
        intersect: false,
        mode: "index",
        callbacks: {
          label: function(ctx: any) {
            const point = ctx.parsed;

            if (!isNullOrUndef(point.y)) {
              return defaults.plugins.tooltip.callbacks.label.call(this, ctx);
            }

            const { o, h, l, c } = point;
            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };

  getLabelAndValue(index: number): { label: string; value: string } {
    const me = this;
    const parsed = me.getParsed(index) as any;
    const iScale = me._cachedMeta.iScale;
    
    if (!iScale) {
      return { label: "", value: "" };
    }
    
    const axis = iScale.axis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${iScale.getLabelForValue(parsed[axis])}`,
      value
    };
  }

  getAllParsedValues(): number[] {
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    
    if (!iScale) {
      return [];
    }
    
    const axis = iScale.axis;
    const parsed = meta._parsed as any[];
    const values: number[] = [];
    for (let i = 0; i < parsed.length; ++i) {
      values.push(parsed[i][axis]);
    }
    return values;
  }

  /**
   * Implement this ourselves since it doesn't handle high and low values
   * https://github.com/chartjs/Chart.js/issues/7328
   */
  getMinMax(scale: any): { min: number; max: number } {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed as any[];
    const iScale = meta.iScale;
    
    if (!iScale) {
      return { min: 0, max: 1 };
    }
    
    const axis = iScale.axis;

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === iScale) {
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

  _getRuler(): any {
    const me = this;
    const opts = me.options;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    
    if (!iScale) {
      throw new Error("iScale is not available");
    }
    
    const axis = iScale.axis;
    const pixels: number[] = [];
    
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(iScale.getPixelForValue(me.getParsed(i)[axis]));
    }
    
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    
    return {
      min,
      pixels,
      start: (iScale as any)._startPixel || 0,
      end: (iScale as any)._endPixel || 0,
      stackCount: (me as any)._getStackCount ? (me as any)._getStackCount() : 1,
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Calculate element properties for financial data points
   */
  calculateElementProperties(
    index: number,
    ruler: any,
    reset: boolean,
    options: any
  ): FinancialElementProperties {
    const me = this;
    const vscale = me._cachedMeta.vScale;
    
    if (!vscale) {
      throw new Error("vScale is not available");
    }
    
    const base = vscale.getBasePixel();
    const ipixels = (me as any)._calculateBarIndexPixels(index, ruler, options);
    const data = me.chart.data.datasets[me.index].data[index] as FinancialDataPoint;
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

  draw(): void {
    const me = this;
    const chart = me.chart;
    const rects = me._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea);
    for (let i = 0; i < rects.length; ++i) {
      (rects[i] as any).draw(chart.ctx);
    }
    unclipArea(chart.ctx);
  }
}