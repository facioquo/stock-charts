// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickController - extends FinancialController for candlestick chart types

import { FinancialController } from "./financial-controller";
import type { ControllerType, ScaleWithInternals } from "./types";

/**
 * Candlestick Controller
 * Specialized controller for candlestick charts
 */
export class CandlestickController extends FinancialController {
  static readonly id = "candlestick" as const;

  static override overrides = {
    ...FinancialController.overrides,
    datasets: {
      barPercentage: 0.6,
      categoryPercentage: 0.8
    }
  };

  /**
   * Update chart elements for candlestick display
   */
  updateElements(
    elements: Array<{ options?: Record<string, unknown> }>,
    start: number,
    count: number,
    mode: string
  ): void {
    const reset = mode === "reset";
    const ruler = (this as any)._getRuler();
    const sharedOptionsResult = (this as unknown as ControllerType)._getSharedOptions(start, mode);
    const { sharedOptions, includeOptions } = sharedOptionsResult as {
      sharedOptions?: Record<string, unknown>;
      includeOptions: boolean;
    };

    for (let i = start; i < start + count; i++) {
      const options =
        sharedOptions ?? (this as unknown as ControllerType).resolveDataElementOptions(i, mode);

      const baseProperties = this.calculateElementProperties(i, ruler, reset, options);

      if (includeOptions) {
        baseProperties.options = options;
      }

      (this as unknown as ControllerType).updateElement(elements[i], i, baseProperties, mode);
    }
  }

  /**
   * Get ruler configuration for candlestick charts
   * Optimized implementation from reference
   */
  _getRuler(): Record<string, unknown> {
    const opts = (this as unknown as ControllerType).options;
    const meta = this._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale?.axis ?? "x";
    const pixels: number[] = [];

    // Build pixel array efficiently
    for (let i = 0, len = meta.data.length; i < len; ++i) {
      const parsed = this.getParsed(i) as Record<string, number>;
      pixels.push(iScale?.getPixelForValue(parsed[axis]) ?? 0);
    }

    const barThickness = opts.barThickness;
    const min = this._computeMinSampleSize(iScale, pixels);

    return {
      min,
      pixels,
      start: (iScale as ScaleWithInternals)?._startPixel ?? 0,
      end: (iScale as ScaleWithInternals)?._endPixel ?? 0,
      stackCount: (this as unknown as ControllerType)._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * Compute minimum sample size for optimal bar spacing
   */
  private _computeMinSampleSize(scale: ScaleWithInternals | undefined, pixels: number[]): number {
    let min = scale?._length ?? Number.MAX_SAFE_INTEGER;

    for (let i = 1, len = pixels.length; i < len; ++i) {
      const curr = Math.abs(pixels[i] - pixels[i - 1]);
      if (curr < min) {
        min = curr;
      }
    }

    return min;
  }
}
