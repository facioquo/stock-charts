// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// FinancialController base class for OHLC and Candlestick controllers

import { BarController, Chart, defaults } from "chart.js";
import { clipArea, unclipArea, isNullOrUndef } from "chart.js/helpers";
import { FinancialDataPoint } from "./types";

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 */
function computeMinSampleSize(scale: any, pixels: number[]): number {
  let min = scale._length;
  let prev: number, curr: number, i: number, ilen: number;

  for (i = 1, ilen = pixels.length; i < ilen; ++i) {
    curr = Math.abs(pixels[i] - pixels[i - 1]);
    if (curr < min) {
      prev = pixels[i - 1];
      min = curr;
    }
  }

  return min;
}

/**
 * Base controller for financial charts (OHLC and Candlestick)
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {
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
          label(ctx: any) {
            const point = ctx.parsed;

            if (!isNullOrUndef(point.y)) {
              return (defaults.plugins.tooltip.callbacks.label as any).call(this, ctx);
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
    const axis = me._cachedMeta.iScale?.axis || "x";

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${me._cachedMeta.iScale?.getLabelForValue(parsed[axis]) || ""}`,
      value
    };
  }

  getAllParsedValues(): number[] {
    const meta = this._cachedMeta;
    const axis = meta.iScale?.axis || "x";
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
    const axis = meta.iScale?.axis || "x";

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < _parsed.length; i++) {
      const data = _parsed[i] as any;
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

  _getRuler(): any {
    const me = this;
    const opts = (me as any).options;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale?.axis || "x";
    const pixels: number[] = [];
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(iScale?.getPixelForValue((me.getParsed(i) as any)[axis]) || 0);
    }
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    return {
      min,
      pixels,
      start: (iScale as any)?._startPixel || 0,
      end: (iScale as any)?._endPixel || 0,
      stackCount: (me as any)._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Calculate element properties for financial data
   */
  calculateElementProperties(index: number, ruler: any, reset: boolean, options: any): any {
    const me = this;
    const vscale = me._cachedMeta.vScale;
    const base = vscale?.getBasePixel() || 0;
    const ipixels = (me as any)._calculateBarIndexPixels(index, ruler, options);
    const data = me.chart.data.datasets[me.index].data[index] as FinancialDataPoint;

    if (!data || !vscale) {
      return {};
    }

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
      if (rects[i] && typeof (rects[i] as any).draw === "function") {
        (rects[i] as any).draw(chart.ctx);
      }
    }
    unclipArea(chart.ctx);
  }
}
