import { MIN_BARS } from "../helpers/calculate-optimal-bars";

/** A run of `count` bars starting at history index `start`. */
export interface BarWindow {
  start: number;
  count: number;
}

/**
 * Clamp a window to the history: `count` to [MIN_BARS, length] (or `length`
 * when the history is shorter than the minimum) and `start` so the window
 * stays within [0, length - count].
 */
export function clampWindow(start: number, count: number, length: number): BarWindow {
  if (length <= 0) return { start: 0, count: 0 };

  const wanted = Number.isNaN(count) ? MIN_BARS : Math.floor(count);
  const clampedCount = Math.min(length, Math.max(MIN_BARS, wanted));

  const wantedStart = Number.isNaN(start) ? 0 : Math.floor(start);
  const clampedStart = Math.min(length - clampedCount, Math.max(0, wantedStart));

  return { start: clampedStart, count: clampedCount };
}

/** Shift a window by a signed number of bars, stopping at the history ends. */
export function panWindow(window: BarWindow, bars: number, length: number): BarWindow {
  const shift = Number.isNaN(bars) ? 0 : Math.round(bars);
  return clampWindow(window.start + shift, window.count, length);
}

/**
 * Scale a window's bar count by `factor` (>1 zooms out, <1 zooms in) while the
 * bar at `anchor` (0..1 across the window) keeps its fractional position.
 */
export function zoomWindow(
  window: BarWindow,
  factor: number,
  anchor: number,
  length: number
): BarWindow {
  if (Number.isNaN(factor) || factor <= 0) {
    return clampWindow(window.start, window.count, length);
  }

  const fraction = Number.isNaN(anchor) ? 0.5 : Math.min(1, Math.max(0, anchor));
  const anchorBar = window.start + fraction * window.count;
  // Round, then step by one bar when the factor is not 1, so a wheel handler
  // alternating 0.98 and 1/0.98 zooms out as readily as it zooms in.
  const rounded = Math.round(window.count * factor);
  const stepped =
    rounded === window.count && factor !== 1 ? window.count + Math.sign(factor - 1) : rounded;
  const count = clampWindow(0, stepped, length).count;

  return clampWindow(Math.round(anchorBar - fraction * count), count, length);
}
