import { describe, it, expect } from "vitest";
import {
  loadStaticQuotes,
  loadStaticIndicatorData,
  type RawIndicatorRow,
  type RawQuote
} from "./static";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createQuote(
  dateStr: string,
  close = 100
): { timestamp: string; open: number; high: number; low: number; close: number; volume: number } {
  return {
    timestamp: dateStr,
    open: close - 1,
    high: close + 1,
    low: close - 2,
    close,
    volume: 500
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("loadStaticQuotes", () => {
  it("converts date strings to Date objects", () => {
    const quotes = [createQuote("2024-01-15T00:00:00Z")];
    const [q] = loadStaticQuotes(quotes);

    expect(q.timestamp).toBeInstanceOf(Date);
    expect(q.timestamp.toISOString()).toBe("2024-01-15T00:00:00.000Z");
  });

  it("preserves all OHLCV fields", () => {
    const quotes = [
      { timestamp: "2024-06-01", open: 10, high: 20, low: 5, close: 15, volume: 9999 }
    ];
    const [q] = loadStaticQuotes(quotes);

    expect(q).toMatchObject({
      open: 10,
      high: 20,
      low: 5,
      close: 15,
      volume: 9999
    });
  });

  it("returns empty array for empty input", () => {
    expect(loadStaticQuotes([])).toEqual([]);
  });

  it("preserves array order", () => {
    const quotes = [
      createQuote("2024-01-01", 50),
      createQuote("2024-01-02", 60),
      createQuote("2024-01-03", 70)
    ];
    const result = loadStaticQuotes(quotes);

    expect(result).toHaveLength(3);
    expect(result[0].close).toBe(50);
    expect(result[2].close).toBe(70);
  });

  it("accepts an explicit RawQuote[] fixture", () => {
    const fixture: RawQuote[] = [
      { timestamp: "2024-02-01T00:00:00Z", open: 1, high: 2, low: 0, close: 1.5, volume: 10 },
      { timestamp: new Date("2024-02-02T00:00:00Z"), open: 2, high: 3, low: 1, close: 2.5, volume: 20 }
    ];
    const result = loadStaticQuotes(fixture);

    expect(result).toHaveLength(2);
    expect(result[0].timestamp.toISOString()).toBe("2024-02-01T00:00:00.000Z");
    expect(result[1].timestamp.toISOString()).toBe("2024-02-02T00:00:00.000Z");
  });
});

describe("loadStaticIndicatorData", () => {
  it("returns typed array from raw data", () => {
    const raw = [
      { timestamp: "2024-01-01", sma: 50.5 },
      { timestamp: "2024-01-02", sma: 51.0 }
    ];
    const result = loadStaticIndicatorData(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("timestamp", "2024-01-01");
  });

  it("returns empty array for empty input", () => {
    expect(loadStaticIndicatorData([])).toEqual([]);
  });

  it("passes through data as-is without transformation", () => {
    const raw = [{ timestamp: "2024-01-01", sma: null, ema: 42 }];
    const result = loadStaticIndicatorData(raw);

    expect(result[0]).toStrictEqual({ timestamp: "2024-01-01", sma: null, ema: 42 });
  });

  it("accepts an explicit RawIndicatorRow[] fixture", () => {
    const fixture: RawIndicatorRow[] = [
      { timestamp: "2024-03-01", sma: 100.0 },
      { timestamp: "2024-03-02", sma: 100.5, ema: 99.7 }
    ];
    const result = loadStaticIndicatorData(fixture);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ sma: 100.5, ema: 99.7 });
  });
});
