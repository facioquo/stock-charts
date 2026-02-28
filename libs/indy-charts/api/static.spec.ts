import { describe, it, expect } from "vitest";
import { loadStaticQuotes, loadStaticIndicatorData } from "./static";
import type { RawQuote } from "../config/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rawQuote(dateStr: string, close = 100): RawQuote {
  return {
    date: dateStr,
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
    const raw: RawQuote[] = [rawQuote("2024-01-15T00:00:00Z")];
    const [q] = loadStaticQuotes(raw);

    expect(q.date).toBeInstanceOf(Date);
    expect(q.date.toISOString()).toBe("2024-01-15T00:00:00.000Z");
  });

  it("preserves all OHLCV fields", () => {
    const raw: RawQuote[] = [
      { date: "2024-06-01", open: 10, high: 20, low: 5, close: 15, volume: 9999 }
    ];
    const [q] = loadStaticQuotes(raw);

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
    const raw: RawQuote[] = [
      rawQuote("2024-01-01", 50),
      rawQuote("2024-01-02", 60),
      rawQuote("2024-01-03", 70)
    ];
    const quotes = loadStaticQuotes(raw);

    expect(quotes).toHaveLength(3);
    expect(quotes[0].close).toBe(50);
    expect(quotes[2].close).toBe(70);
  });
});

describe("loadStaticIndicatorData", () => {
  it("returns typed array from raw data", () => {
    const raw = [
      { date: "2024-01-01", sma: 50.5 },
      { date: "2024-01-02", sma: 51.0 }
    ];
    const result = loadStaticIndicatorData(raw);

    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("date", "2024-01-01");
  });

  it("returns empty array for empty input", () => {
    expect(loadStaticIndicatorData([])).toEqual([]);
  });

  it("passes through data as-is without transformation", () => {
    const raw = [{ date: "2024-01-01", sma: null, ema: 42 }];
    const result = loadStaticIndicatorData(raw);

    expect(result[0]).toStrictEqual({ date: "2024-01-01", sma: null, ema: 42 });
  });
});
