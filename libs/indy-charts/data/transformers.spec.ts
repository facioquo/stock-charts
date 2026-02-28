import { describe, it, expect } from "vitest";
import { ScatterDataPoint } from "chart.js";
import {
  processQuoteData,
  buildDataPoints,
  addExtraBars,
  getCandlePointConfiguration
} from "./transformers";
import type {
  IndicatorDataRow,
  IndicatorListing,
  IndicatorResult,
  Quote
} from "../config/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQuote(
  dateStr: string,
  close = 100,
  volume = 1000
): Quote {
  return {
    date: new Date(dateStr),
    open: close - 1,
    high: close + 2,
    low: close - 3,
    close,
    volume
  };
}

function makeListing(overrides?: Partial<IndicatorListing>): IndicatorListing {
  return {
    name: "SMA",
    uiid: "SMA",
    legendTemplate: "SMA({0})",
    endpoint: "sma",
    category: "overlay",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [],
    results: [
      {
        displayName: "SMA",
        tooltipTemplate: "",
        dataName: "sma",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 2,
        defaultColor: "#FF0000",
        order: 0
      }
    ],
    ...overrides
  };
}

function makeResult(overrides?: Partial<IndicatorResult>): IndicatorResult {
  return {
    displayName: "SMA",
    label: "SMA",
    dataName: "sma",
    color: "#FF0000",
    lineType: "solid",
    lineWidth: 2,
    order: 0,
    dataset: {} as IndicatorResult["dataset"],
    ...overrides
  };
}

function makeRow(dateStr: string, values: Record<string, unknown> = {}): IndicatorDataRow {
  return {
    date: dateStr,
    candle: makeQuote(dateStr),
    ...values
  };
}

// ---------------------------------------------------------------------------
// processQuoteData
// ---------------------------------------------------------------------------

describe("processQuoteData", () => {
  it("converts quotes to FinancialDataPoint array", () => {
    const quotes = [makeQuote("2024-01-02")];
    const { priceData } = processQuoteData(quotes);

    expect(priceData).toHaveLength(1);
    expect(priceData[0]).toMatchObject({
      o: 99,
      h: 102,
      l: 97,
      c: 100
    });
  });

  it("converts date to epoch timestamp", () => {
    const quotes = [makeQuote("2024-06-15T00:00:00Z")];
    const { priceData } = processQuoteData(quotes);

    expect(priceData[0].x).toBe(new Date("2024-06-15T00:00:00Z").valueOf());
  });

  it("calculates volumeAxisSize as 20× average volume", () => {
    const quotes = [
      makeQuote("2024-01-01", 100, 1000),
      makeQuote("2024-01-02", 100, 3000)
    ];
    const { volumeAxisSize } = processQuoteData(quotes);

    // avg = (1000+3000)/2 = 2000, 20 × 2000 = 40000
    expect(volumeAxisSize).toBe(40000);
  });

  it("returns volumeAxisSize 0 for empty quotes", () => {
    const { volumeAxisSize, priceData } = processQuoteData([]);

    expect(priceData).toEqual([]);
    expect(volumeAxisSize).toBe(0);
  });

  it("preserves order of quotes", () => {
    const quotes = [
      makeQuote("2024-01-01", 50),
      makeQuote("2024-01-02", 60),
      makeQuote("2024-01-03", 70)
    ];
    const { priceData } = processQuoteData(quotes);

    expect(priceData).toHaveLength(3);
    expect(priceData[0].c).toBe(50);
    expect(priceData[2].c).toBe(70);
  });

  it("handles zero volume correctly without division error", () => {
    const quotes = [makeQuote("2024-01-01", 100, 0)];
    const { volumeAxisSize } = processQuoteData(quotes);

    expect(volumeAxisSize).toBe(0);
    expect(Number.isFinite(volumeAxisSize)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// buildDataPoints
// ---------------------------------------------------------------------------

describe("buildDataPoints", () => {
  it("maps numeric values to ScatterDataPoint y-axis", () => {
    const data = [makeRow("2024-01-01", { sma: 55.5 })];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing();

    const { dataPoints } = buildDataPoints(data, result, listing);

    expect(dataPoints).toHaveLength(1);
    expect(dataPoints[0].y).toBe(55.5);
  });

  it("uses NaN for null/undefined values", () => {
    const data = [
      makeRow("2024-01-01", { sma: null }),
      makeRow("2024-01-02", { sma: undefined }),
      makeRow("2024-01-03", {}) // 'sma' key missing entirely
    ];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing();

    const { dataPoints } = buildDataPoints(data, result, listing);

    expect(dataPoints).toHaveLength(3);
    dataPoints.forEach(dp => expect(dp.y).toBeNaN());
  });

  it("converts date strings to epoch timestamps", () => {
    const data = [makeRow("2024-06-15T00:00:00Z", { sma: 50 })];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing();

    const { dataPoints } = buildDataPoints(data, result, listing);

    expect(dataPoints[0].x).toBe(new Date("2024-06-15T00:00:00Z").valueOf());
  });

  it("returns empty arrays for empty data", () => {
    const result = makeResult();
    const listing = makeListing();

    const { dataPoints, pointColor, pointRotation } = buildDataPoints([], result, listing);

    expect(dataPoints).toEqual([]);
    expect(pointColor).toEqual([]);
    expect(pointRotation).toEqual([]);
  });

  it("assigns defaultColor from listing results config", () => {
    const data = [makeRow("2024-01-01", { sma: 50 })];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing({
      results: [
        {
          displayName: "SMA",
          tooltipTemplate: "",
          dataName: "sma",
          dataType: "number",
          lineType: "solid",
          stack: "",
          lineWidth: 2,
          defaultColor: "#ABCDEF",
          order: 0
        }
      ]
    });

    const { pointColor } = buildDataPoints(data, result, listing);

    expect(pointColor[0]).toBe("#ABCDEF");
  });

  it("falls back to GRAY when result config not found in listing", () => {
    const data = [makeRow("2024-01-01", { sma: 50 })];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing({ results: [] }); // no matching results config

    const { pointColor } = buildDataPoints(data, result, listing);

    expect(pointColor[0]).toBe("#9E9E9E"); // COLORS.GRAY
  });

  it("sets rotation to 0 for non-candlestick-pattern indicators", () => {
    const data = [makeRow("2024-01-01", { sma: 50 })];
    const result = makeResult({ dataName: "sma" });
    const listing = makeListing({ category: "overlay" });

    const { pointRotation } = buildDataPoints(data, result, listing);

    expect(pointRotation[0]).toBe(0);
  });

  // Candlestick pattern tests

  it("applies candle point config for candlestick-pattern category", () => {
    const candle = makeQuote("2024-01-01", 100);
    const data: IndicatorDataRow[] = [
      { date: "2024-01-01", candle, signal: 42, match: 100 }
    ];
    const result = makeResult({ dataName: "signal" });
    const listing = makeListing({ category: "candlestick-pattern" });

    const { dataPoints, pointColor, pointRotation } = buildDataPoints(data, result, listing);

    // match=100 → bullish → green, rotation 0, yValue = 0.99 * candle.low
    expect(dataPoints[0].y).toBeCloseTo(0.99 * candle.low);
    expect(pointColor[0]).toBe("#2E7D32"); // COLORS.GREEN
    expect(pointRotation[0]).toBe(0);
  });

  it("applies bearish candle config for match=-100", () => {
    const candle = makeQuote("2024-01-01", 100);
    const data: IndicatorDataRow[] = [
      { date: "2024-01-01", candle, signal: 42, match: -100 }
    ];
    const result = makeResult({ dataName: "signal" });
    const listing = makeListing({ category: "candlestick-pattern" });

    const { dataPoints, pointColor, pointRotation } = buildDataPoints(data, result, listing);

    // match=-100 → bearish → red, rotation 180, yValue = 1.01 * candle.high
    expect(dataPoints[0].y).toBeCloseTo(1.01 * candle.high);
    expect(pointColor[0]).toBe("#DD2C00"); // COLORS.RED
    expect(pointRotation[0]).toBe(180);
  });
});

// ---------------------------------------------------------------------------
// addExtraBars
// ---------------------------------------------------------------------------

describe("addExtraBars", () => {
  it("appends the requested number of extra bars", () => {
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05").valueOf(), y: 100 } // Friday
    ];

    addExtraBars(dataPoints, 3);

    expect(dataPoints).toHaveLength(4); // 1 original + 3 extra
  });

  it("skips weekends (Saturday and Sunday)", () => {
    // 2024-01-05 is a Friday
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05T00:00:00Z").valueOf(), y: 100 }
    ];

    addExtraBars(dataPoints, 3);

    // Extra bars should be Mon 2024-01-08, Tue 2024-01-09, Wed 2024-01-10
    const extraDates = dataPoints.slice(1).map(dp => new Date(dp.x as number));

    extraDates.forEach(d => {
      // addExtraBars uses getDay() (local time), so assert with getDay()
      const day = d.getDay();
      expect(day).not.toBe(0); // not Sunday
      expect(day).not.toBe(6); // not Saturday
    });
  });

  it("sets extra bars y-value to NaN", () => {
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05").valueOf(), y: 100 }
    ];

    addExtraBars(dataPoints, 2);

    expect(dataPoints[1].y).toBeNaN();
    expect(dataPoints[2].y).toBeNaN();
  });

  it("handles empty dataPoints array (falls back to today)", () => {
    const dataPoints: ScatterDataPoint[] = [];

    addExtraBars(dataPoints, 2);

    expect(dataPoints).toHaveLength(2);
    dataPoints.forEach(dp => {
      expect(dp.y).toBeNaN();
      expect(typeof dp.x).toBe("number");
    });
  });

  it("does nothing when extraBars is 0", () => {
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05").valueOf(), y: 100 }
    ];

    addExtraBars(dataPoints, 0);

    expect(dataPoints).toHaveLength(1);
  });

  it("produces strictly increasing timestamps", () => {
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05").valueOf(), y: 100 }
    ];

    addExtraBars(dataPoints, 5);

    for (let i = 1; i < dataPoints.length; i++) {
      expect(dataPoints[i].x as number).toBeGreaterThan(dataPoints[i - 1].x as number);
    }
  });

  it("advances from Friday to Monday correctly", () => {
    // 2024-01-05 is a Friday
    const dataPoints: ScatterDataPoint[] = [
      { x: new Date("2024-01-05T12:00:00Z").valueOf(), y: 100 }
    ];

    addExtraBars(dataPoints, 1);

    const nextDate = new Date(dataPoints[1].x as number);
    // Should be Monday (day 1)
    expect(nextDate.getDay()).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getCandlePointConfiguration
// ---------------------------------------------------------------------------

describe("getCandlePointConfiguration", () => {
  const candle = makeQuote("2024-01-01", 100);

  it("returns bearish config for match=-100", () => {
    const config = getCandlePointConfiguration(-100, candle);

    expect(config.yValue).toBeCloseTo(1.01 * candle.high);
    expect(config.color).toBe("#DD2C00"); // COLORS.RED
    expect(config.rotation).toBe(180);
  });

  it("returns bullish config for match=100", () => {
    const config = getCandlePointConfiguration(100, candle);

    expect(config.yValue).toBeCloseTo(0.99 * candle.low);
    expect(config.color).toBe("#2E7D32"); // COLORS.GREEN
    expect(config.rotation).toBe(0);
  });

  it("returns neutral/default config for match=0", () => {
    const config = getCandlePointConfiguration(0, candle);

    expect(config.yValue).toBeCloseTo(0.99 * candle.low);
    expect(config.color).toBe("#9E9E9E"); // COLORS.GRAY
    expect(config.rotation).toBe(0);
  });

  it("returns neutral config for any other match value", () => {
    const config = getCandlePointConfiguration(50, candle);

    expect(config.yValue).toBeCloseTo(0.99 * candle.low);
    expect(config.color).toBe("#9E9E9E");
    expect(config.rotation).toBe(0);
  });

  it("applies multiplier correctly for bearish (high × 1.01)", () => {
    const q = makeQuote("2024-01-01", 200); // high = 202
    const config = getCandlePointConfiguration(-100, q);

    expect(config.yValue).toBe(1.01 * 202);
  });

  it("applies multiplier correctly for bullish (low × 0.99)", () => {
    const q = makeQuote("2024-01-01", 200); // low = 197
    const config = getCandlePointConfiguration(100, q);

    expect(config.yValue).toBe(0.99 * 197);
  });
});
