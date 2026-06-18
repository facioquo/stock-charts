import { type ScatterDataPoint } from "chart.js";

import { type FinancialDataPoint } from "../types/financial.types";
import { COLORS } from "../theme/colors";
import {
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorResult,
  type Quote
} from "../config/types";

const CANDLE_HIGH_MULTIPLIER = 1.01;
const CANDLE_LOW_MULTIPLIER = 0.99;
const SEGMENT_EPSILON = 1e-8;

const CATEGORIES = {
  CANDLESTICK_PATTERN: "candlestick-pattern"
} as const;

export function processQuoteData(quotes: Quote[]): {
  priceData: FinancialDataPoint[];
  volumeAxisSize: number;
} {
  const priceData: FinancialDataPoint[] = [];
  let sumVol = 0;

  quotes.forEach((q: Quote) => {
    priceData.push({
      x: new Date(q.timestamp).valueOf(),
      o: q.open,
      h: q.high,
      l: q.low,
      c: q.close
    });

    sumVol += q.volume;
  });

  const volumeAxisSize = 20 * (sumVol / Math.max(1, quotes.length)) || 0;

  return { priceData, volumeAxisSize };
}

export function buildDataPoints(
  data: IndicatorDataRow[],
  result: IndicatorResult,
  listing: IndicatorListing
): {
  dataPoints: ScatterDataPoint[];
  pointColor: string[];
  pointRotation: number[];
  hasConditionalColor: boolean;
} {
  const dataPoints: ScatterDataPoint[] = [];
  const pointColor: string[] = [];
  const pointRotation: number[] = [];
  let hasConditionalColor = false;

  const resultConfig = listing.results.find(x => x.dataName === result.dataName);

  // Segmented level lines (e.g. monthly Pivot Points) hold a constant value
  // within each window and step at each boundary. Replacing the first value of
  // every new window with NaN makes Chart.js break the line there (gaps are not
  // spanned by default), so each window renders as its own horizontal segment
  // instead of a continuous staircase. Replacing — rather than inserting — keeps
  // the dataset index-aligned with quotes, which window slicing and the
  // structuredClone resize cache both depend on.
  //
  // Intended only for piecewise-constant series where each level persists for
  // multiple consecutive points (e.g. weekly/monthly pivots). On a series that
  // changes every point, every value after the first would be NaN'd away, so do
  // not set `segmented` on continuous indicators (EMA, rolling pivots, etc.).
  const segmented = resultConfig?.segmented === true;
  const segmentMode = resultConfig?.segmentMode ?? "step";
  let previousLevel: number | undefined;
  let previousSlope: number | undefined;

  data.forEach(row => {
    const rawValue: unknown = row[result.dataName];
    let yValue = typeof rawValue === "number" ? rawValue : undefined;

    // apply candle pointers (CANDLESTICK_PATTERN rows include a `candle` field
    // from the API; skip the styling if a fixture-supplied row omits it)
    if (yValue !== undefined && listing.category === CATEGORIES.CANDLESTICK_PATTERN && row.candle) {
      const rawMatch = row["match"];
      const matchValue = typeof rawMatch === "number" ? rawMatch : 0;
      const candleConfig = getCandlePointConfiguration(matchValue, row.candle);
      yValue = candleConfig.yValue;
      pointColor.push(candleConfig.color);
      pointRotation.push(candleConfig.rotation);
      hasConditionalColor = true;
    } else {
      // expanding/contracting series (e.g. the Gator Oscillator) carry a
      // companion `<dataName>IsExpanding` boolean per row; color each bar green
      // while the histogram is widening and red while it is narrowing — the
      // standard depiction — rather than a single static series color.
      const expandingColor = resolveExpandingColor(row, result.dataName);
      if (expandingColor) {
        pointColor.push(expandingColor);
        hasConditionalColor = true;
      } else {
        pointColor.push(resultConfig?.defaultColor ?? COLORS.GRAY);
      }
      pointRotation.push(0);
    }

    if (typeof yValue !== "number") {
      yValue = NaN;
      previousLevel = undefined;
      previousSlope = undefined;
    } else if (segmented) {
      if (segmentMode === "slope") {
        // Break segmented sloped channels where slope changes between windows.
        // The boundary point is replaced with NaN so Chart.js starts a new
        // segment without drawing a connecting transition.
        const currentLevel = yValue;
        if (previousLevel !== undefined) {
          const slope = currentLevel - previousLevel;
          const isBoundary =
            previousSlope !== undefined && !nearlyEqual(slope, previousSlope, SEGMENT_EPSILON);
          previousSlope = slope;
          previousLevel = currentLevel;
          if (isBoundary) {
            yValue = NaN;
          }
        } else {
          previousLevel = currentLevel;
          previousSlope = undefined;
        }
      } else {
        // break the line at each window boundary (where the level steps)
        const isBoundary = previousLevel !== undefined && !nearlyEqual(yValue, previousLevel, SEGMENT_EPSILON);
        previousLevel = yValue;
        if (isBoundary) {
          yValue = NaN;
        }
      }
    }
    if (row.timestamp == null) {
      throw new Error(`Indicator row missing 'timestamp' field for "${result.dataName}"`);
    }
    const x = new Date(row.timestamp).valueOf();
    if (!Number.isFinite(x)) {
      throw new Error(
        `Indicator row has invalid timestamp for "${result.dataName}": ${String(row.timestamp)}`
      );
    }
    dataPoints.push({ x, y: yValue });
  });

  return { dataPoints, pointColor, pointRotation, hasConditionalColor };
}

function nearlyEqual(a: number, b: number, epsilon: number): boolean {
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) <= epsilon * scale;
}

/**
 * Resolve the per-bar color for an expanding/contracting histogram series.
 *
 * Series such as the Gator Oscillator expose a `<dataName>IsExpanding` boolean
 * alongside each value (e.g. `upper` → `upperIsExpanding`). When present, the
 * bar is green while the value is growing and red while it is shrinking.
 * Returns `undefined` for series without the companion flag so callers fall
 * back to the configured static color.
 */
function resolveExpandingColor(row: IndicatorDataRow, dataName: string): string | undefined {
  const flag = row[`${dataName}IsExpanding`];
  if (typeof flag !== "boolean") return undefined;
  return flag ? COLORS.GREEN : COLORS.RED;
}

export function addExtraBars(dataPoints: ScatterDataPoint[], extraBars: number): void {
  const maxTime =
    dataPoints.length > 0
      ? Math.max(
          ...dataPoints.map(h => {
            const dateTime = h.x != null ? new Date(h.x).getTime() : 0;
            return Number.isFinite(dateTime) ? dateTime : 0;
          })
        )
      : 0;

  // Fall back to today when dataPoints is empty or every timestamp was invalid.
  const baseDate = maxTime > 0 ? new Date(maxTime) : new Date();

  for (let i = 0; i < extraBars; i++) {
    // Advance to the next business day, skipping Saturday (6) and Sunday (0),
    // so extra bars align with expected trading sessions on daily charts.
    // UTC methods keep the padded dates deterministic across client timezones —
    // local-time arithmetic would shift the cadence near midnight UTC and let
    // overlay vs oscillator x-axes drift apart on browsers in different zones.
    do {
      baseDate.setUTCDate(baseDate.getUTCDate() + 1);
    } while (baseDate.getUTCDay() === 0 || baseDate.getUTCDay() === 6);
    dataPoints.push({ x: baseDate.valueOf(), y: NaN });
  }
}

export function getCandlePointConfiguration(
  match: number,
  candle: Quote
): { yValue: number; color: string; rotation: number } {
  switch (match) {
    case -100:
      return {
        yValue: CANDLE_HIGH_MULTIPLIER * candle.high,
        color: COLORS.RED,
        rotation: 180
      };
    case 100:
      return {
        yValue: CANDLE_LOW_MULTIPLIER * candle.low,
        color: COLORS.GREEN,
        rotation: 0
      };
    default:
      return {
        yValue: CANDLE_LOW_MULTIPLIER * candle.low,
        color: COLORS.GRAY,
        rotation: 0
      };
  }
}
