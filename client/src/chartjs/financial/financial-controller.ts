// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { BarController, Chart, defaults } from "chart.js";
import { clipArea, isNullOrUndef, unclipArea } from "chart.js/helpers";
import { FinancialDataPoint } from "./types";

function computeMinSampleSize(scale: any, pixels: number[]): number {
  let min = scale._length;
  let prev: number = 0;
  let curr: number;

  for (let i = 1; i < pixels.length; ++i) {
    min = Math.min(min, Math.abs(pixels[i] - pixels[i - 1]));
  }

  for (let i = 0; i < scale.ticks.length; ++i) {
    curr = scale.getPixelForTick(i);
    min = i > 0 ? Math.min(min, Math.abs(curr - prev)) : min;
    prev = curr;
  }

  return min;
}

/**
 * Base class for financial chart controllers
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
export class FinancialController extends BarController {
  declare _cachedMeta: any;
  declare chart: Chart;
  declare index: number;
  declare options: any;
  declare _ruler: any;

  getLabelAndValue(index: number): { label: string; value: string } {
    const parsed = this.getParsed(index) as any;
    const axis = this._cachedMeta.iScale.axis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${this._cachedMeta.iScale.getLabelForValue(parsed[axis])}`,
      value
    };
  }

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
  getMinMax(scale: any): { min: number; max: number } {
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
      const data = _parsed[i] as FinancialDataPoint;
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

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
      stackCount: (this as any)._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * @protected
   */
  calculateElementProperties(index: number, ruler: any, reset: boolean, options: any): any {
    const vscale = this._cachedMeta.vScale;
    const base = vscale.getBasePixel();
    const ipixels = (this as any)._calculateBarIndexPixels(index, ruler, options);
    const data = this.chart.data.datasets[this.index].data[index] as FinancialDataPoint;
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
    const chart = this.chart;
    const rects = this._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea);
    for (let i = 0; i < rects.length; ++i) {
      rects[i].draw(chart.ctx);
    }
    unclipArea(chart.ctx);
  }

  static readonly overrides = {
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
              return (defaults as any).plugins.tooltip.callbacks.label(ctx);
            }

            const { o, h, l, c } = point;

            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };
}