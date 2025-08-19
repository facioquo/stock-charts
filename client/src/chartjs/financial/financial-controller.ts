// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// FinancialController base class for OHLC and Candlestick controllers

import { BarController, defaults } from "chart.js";
import { isNullOrUndef } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import type {
  ControllerWithInternals,
  FinancialDataPoint,
  FinancialTooltipContext,
  ScaleWithInternals
} from "./types";

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 * Performance optimization from the reference implementation.
 */
function _computeMinSampleSize(scale: ScaleWithInternals | undefined, pixels: number[]): number {
  let min = scale?._length ?? Number.MAX_SAFE_INTEGER;
  let curr: number;

  for (let i = 1, ilen = pixels.length; i < ilen; ++i) {
    curr = Math.abs(pixels[i] - pixels[i - 1]);
    if (curr < min) {
      min = curr;
    }
  }

  return min;
}

/**
 * Base controller for financial charts (OHLC and Candlestick)
 * This class is based on controller.bar.js from the upstream Chart.js library
 * with financial-specific optimizations from chartjs-chart-financial
 */
export class FinancialController extends BarController {
  /**
   * Default element type for financial controllers
   * Individual controllers (Candlestick, OHLC) should override this
   */
  static dataElementType = FinancialElement;

  static overrides = {
    label: "",
    parsing: false,
    hover: {
      mode: "label"
    },
    animations: {
      numbers: {
        type: "number",
        properties: ["x", "y", "base", "width", "open", "high", "low", "close"]
      }
    },
    scales: {
      x: {
        type: "timeseries",
        offset: true,
        ticks: {
          major: {
            enabled: true
          },
          source: "data",
          maxRotation: 0,
          autoSkip: true,
          autoSkipPadding: 75,
          sampleSize: 100
        }
      },
      y: {
        type: "linear"
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
    const parsed = this.getParsed(index) as FinancialDataPoint;
    const axis = this._cachedMeta.iScale?.axis ?? "x";

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${this._cachedMeta.iScale?.getLabelForValue(parsed[axis]) ?? ""}`,
      value
    };
  }

  getUserBounds(scale: {
    getUserBounds(): { min: number; max: number; minDefined: boolean; maxDefined: boolean };
  }) {
    const { min, max, minDefined, maxDefined } = scale.getUserBounds();
    return {
      min: minDefined ? min : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max : Number.POSITIVE_INFINITY
    };
  }

  /**
   * Get the other scale (non-index scale)
   * @param scale - The current scale
   * @returns The other scale
   */
  _getOtherScale(scale: unknown): {
    getUserBounds(): { min: number; max: number; minDefined: boolean; maxDefined: boolean };
  } {
    const meta = this._cachedMeta;
    if (scale === meta.iScale) {
      return meta.vScale as {
        getUserBounds(): { min: number; max: number; minDefined: boolean; maxDefined: boolean };
      };
    }
    return meta.iScale as {
      getUserBounds(): { min: number; max: number; minDefined: boolean; maxDefined: boolean };
    };
  }
  getMinMax(scale: unknown): { min: number; max: number } {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed as FinancialDataPoint[];
    const axis = meta.iScale?.axis ?? "x";
    const otherScale = this._getOtherScale(scale);
    const { min: otherMin, max: otherMax } = this.getUserBounds(otherScale);

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    // Filter data within bounds for performance
    const filteredData = _parsed.filter(({ x }) => x >= otherMin && x < otherMax);

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    // Optimized loop for min/max calculation
    for (let i = 0, len = filteredData.length; i < len; i++) {
      const data = filteredData[i];
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }

    return { min, max };
  }

  /**
   * Calculate element properties for financial data
   * Performance optimized implementation
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
   * Use Chart.js's default draw behavior instead of custom implementation
   * This ensures proper element instantiation and drawing
   */
  // draw(): void {
  //   const chart = this.chart;
  //   const rects = this._cachedMeta.data;

  //   clipArea(chart.ctx, chart.chartArea);

  //   // Optimized rendering loop
  //   for (let i = 0, len = rects.length; i < len; ++i) {
  //     const rect = rects[i];
  //     if (rect && typeof (rect as unknown as { draw?: unknown }).draw === "function") {
  //       (rect as unknown as { draw: (ctx: CanvasRenderingContext2D) => void }).draw(chart.ctx);
  //     }
  //   }

  //   unclipArea(chart.ctx);
  // }
}
