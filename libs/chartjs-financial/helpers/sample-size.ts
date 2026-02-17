/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

interface ScaleLike {
  _length: number;
  ticks: unknown[];
  getPixelForTick: (index: number) => number;
}

export function computeMinSampleSize(scale: ScaleLike, pixels: number[]): number {
  let min = scale._length;
  let prev: number | undefined;

  for (let i = 1; i < pixels.length; ++i) {
    min = Math.min(min, Math.abs(pixels[i] - pixels[i - 1]));
  }

  for (let i = 0; i < scale.ticks.length; ++i) {
    const curr = scale.getPixelForTick(i);
    min = i > 0 && prev != null ? Math.min(min, Math.abs(curr - prev)) : min;
    prev = curr;
  }

  return min;
}
