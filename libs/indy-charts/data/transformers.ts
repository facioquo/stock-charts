import { ScatterDataPoint } from "chart.js";

import { FinancialDataPoint } from "../types/financial.types";
import { COLORS } from "../theme/colors";
import { IndicatorDataRow, IndicatorListing, IndicatorResult, Quote } from "../config/types";

const CANDLE_HIGH_MULTIPLIER = 1.01;
const CANDLE_LOW_MULTIPLIER = 0.99;

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
      x: new Date(q.date).valueOf(),
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
} {
  const dataPoints: ScatterDataPoint[] = [];
  const pointColor: string[] = [];
  const pointRotation: number[] = [];

  data.forEach(row => {
    const rawValue: unknown = row[result.dataName];
    let yValue = typeof rawValue === "number" ? rawValue : undefined;

    // apply candle pointers
    if (yValue !== undefined && listing.category === CATEGORIES.CANDLESTICK_PATTERN) {
      const candleConfig = getCandlePointConfiguration(row["match"] as number, row.candle);
      yValue = candleConfig.yValue;
      pointColor.push(candleConfig.color);
      pointRotation.push(candleConfig.rotation);
    } else {
      const resultConfig = listing.results.find(x => x.dataName === result.dataName);
      pointColor.push(resultConfig?.defaultColor ?? COLORS.GRAY);
      pointRotation.push(0);
    }

    if (typeof yValue !== "number") {
      yValue = NaN;
    }
    dataPoints.push({ x: new Date(row.date).valueOf(), y: yValue });
  });

  return { dataPoints, pointColor, pointRotation };
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
    do {
      baseDate.setDate(baseDate.getDate() + 1);
    } while (baseDate.getDay() === 0 || baseDate.getDay() === 6);
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
