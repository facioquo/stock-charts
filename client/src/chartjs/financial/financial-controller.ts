// Financial controller base class
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { BarController, Chart, ChartMeta, Scale } from "chart.js";
import { isNullOrUndef, clipArea, unclipArea } from "chart.js/helpers";
import { FinancialDataPoint, FinancialParsedData, FinancialRuler } from "./types";

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 */
function computeMinSampleSize(scale: Scale, pixels: number[]): number {
  let min = scale._length;
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
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {
  static readonly overrides: any;

  declare _cachedMeta: ChartMeta<"candlestick" | "ohlc">;
  declare _ruler?: FinancialRuler;

  getLabelAndValue(index: number): { label: string; value: string } {
    const me = this;
    const parsed = me.getParsed(index) as FinancialParsedData;
    const axis = me._cachedMeta.iScale.axis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${me._cachedMeta.iScale.getLabelForValue(parsed[axis])}`,
      value
    };
  }

  getAllParsedValues(): number[] {
    const meta = this._cachedMeta;
    const axis = meta.iScale.axis;
    const parsed = meta._parsed as FinancialParsedData[];
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
  getMinMax(scale: Scale): { min: number; max: number } {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed as FinancialParsedData[];
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

  _getRuler(): FinancialRuler {
    const me = this;
    const opts = me.options;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale.axis;
    const pixels: number[] = [];
    
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(iScale.getPixelForValue((me.getParsed(i) as FinancialParsedData)[axis]));
    }
    
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    
    return {
      min,
      pixels,
      start: iScale._startPixel,
      end: iScale._endPixel,
      stackCount: me._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Calculate element properties for financial data
   */
  calculateElementProperties(
    index: number,
    ruler: FinancialRuler,
    reset: boolean,
    options: any
  ): any {
    const me = this;
    const vscale = me._cachedMeta.vScale;
    const base = vscale.getBasePixel();
    const ipixels = me._calculateBarIndexPixels(index, ruler, options);
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
      rects[i].draw(chart.ctx);
    }
    unclipArea(chart.ctx);
  }
}

// Set up controller overrides
FinancialController.overrides = {
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
            return Chart.defaults.plugins.tooltip.callbacks.label(ctx);
          }

          const { o, h, l, c } = point;
          return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
        }
      }
    }
  }
};