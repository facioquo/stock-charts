/** Default pixels allocated per bar when computing optimal bar count. */
const DEFAULT_PIXELS_PER_BAR = 5;

/** Minimum number of bars to display. */
const MIN_BARS = 20;

/** Maximum number of bars to display (avoids performance degradation). */
const MAX_BARS = 500;

/**
 * Calculate the optimal number of bars to display in a financial chart
 * based on available container width.
 *
 * Returns a value clamped between {@link MIN_BARS} (20) and
 * {@link MAX_BARS} (500).
 *
 * @param containerWidth - Available width in pixels for the chart.
 * @param pixelsPerBar - Pixels allocated per candlestick bar (default 5).
 * @returns The optimal bar count for the given width.
 */
export function calculateOptimalBars(
  containerWidth: number,
  pixelsPerBar: number = DEFAULT_PIXELS_PER_BAR
): number {
  const calculated = Math.floor(containerWidth / pixelsPerBar);
  return Math.max(MIN_BARS, Math.min(MAX_BARS, calculated));
}
