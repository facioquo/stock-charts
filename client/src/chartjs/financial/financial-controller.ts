// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// FinancialController base class for OHLC and Candlestick controllers

import { BarController, defaults } from "chart.js";
import { clipArea, unclipArea, isNullOrUndef } from "chart.js/helpers";
import type {
  FinancialDataPoint,
  FinancialTooltipContext,
  ScaleWithInternals,
  ControllerWithInternals
} from "./types";

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 */
function computeMinSampleSize(scale: ScaleWithInternals | undefined, pixels: number[]): number {
  let min = scale?._length ?? Number.MAX_SAFE_INTEGER;
  let curr: number, i: number, ilen: number;

  for (i = 1, ilen = pixels.length; i < ilen; ++i) {
    curr = Math.abs(pixels[i] - pixels[i - 1]);
    if (curr < min) {
      // prev = pixels[i - 1]; // Not used, removing assignment
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
          label(ctx: FinancialTooltipContext) {
            const point = ctx.parsed;

            if (!isNullOrUndef(point.y)) {
              return (
                defaults.plugins.tooltip.callbacks.label as (ctx: FinancialTooltipContext) => string
              ).call(this, ctx);
            }

            const { o, h, l, c } = point;
            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };

  getLabelAndValue(index: number): { label: string; value: string } {
    const parsed = this.getParsed(index) as Record<string, number>;
    const axis = this._cachedMeta.iScale?.axis ?? "x";

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${this._cachedMeta.iScale?.getLabelForValue(parsed[axis]) ?? ""}`,
      value
    };
  }

  getAllParsedValues(): number[] {
    const meta = this._cachedMeta;
    const axis = meta.iScale?.axis ?? "x";
    const parsed = meta._parsed as Record<string, number>[];
    const values: number[] = [];
    for (let i = 0; i < parsed.length; ++i) {
      values.push((parsed[i] as Record<string, number>)[axis]);
    }
    return values;
  }

  /**
   * Implement this ourselves since it doesn't handle high and low values
   * https://github.com/chartjs/Chart.js/issues/7328
   */
  getMinMax(scale: unknown): { min: number; max: number } {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed as Record<string, number>[];
    const axis = meta.iScale?.axis ?? "x";

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < _parsed.length; i++) {
      const data = _parsed[i] as Record<string, number>;
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

  _getRuler(): Record<string, unknown> {
    const opts = (this as unknown as ControllerWithInternals).options;
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale?.axis ?? "x";
    const pixels: number[] = [];
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(
        iScale?.getPixelForValue((this.getParsed(i) as Record<string, number>)[axis]) ?? 0
      );
    }
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    return {
      min,
      pixels,
      start: (iScale as ScaleWithInternals)?._startPixel ?? 0,
      end: (iScale as ScaleWithInternals)?._endPixel ?? 0,
      stackCount: (this as unknown as ControllerWithInternals)._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Calculate element properties for financial data
   */
  calculateElementProperties(
    index: number,
    ruler: Record<string, unknown>,
    reset: boolean,
    options: Record<string, unknown>
  ): Record<string, unknown> {
    const vscale = this._cachedMeta.vScale;
    const base = vscale?.getBasePixel() ?? 0;
    const ipixels = (this as unknown as ControllerWithInternals)._calculateBarIndexPixels(
      index,
      ruler,
      options
    );
    const data = this.chart.data.datasets[this.index].data[index] as FinancialDataPoint;

    if (!data || !vscale) {
      return {};
    }

    const open = vscale.getPixelForValue(data.o);
    const high = vscale.getPixelForValue(data.h);
    const low = vscale.getPixelForValue(data.l);
    const close = vscale.getPixelForValue(data.c);

    const pixelInfo = ipixels as { center: number; size: number };

    return {
      base: reset ? base : low,
      x: pixelInfo.center,
      y: (low + high) / 2,
      width: pixelInfo.size,
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
      if (rects[i] && typeof (rects[i] as unknown as { draw?: unknown }).draw === "function") {
        (rects[i] as unknown as { draw: (ctx: unknown) => void }).draw(chart.ctx);
      }
    }
    unclipArea(chart.ctx);
  }
}
