import rawQuotes from "./backup-quotes.json";

interface RawQuote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

describe("backup-quotes.json dataset", () => {
  const quotes = rawQuotes as unknown as RawQuote[];

  it("should contain exactly 1000 quotes", () => {
    expect(quotes.length).toBe(1000);
  });

  it("all dates should be midnight UTC (HH:MM == 00:00)", () => {
    for (const q of quotes) {
      expect(q.date.endsWith("T00:00")).toBe(true);
    }
  });

  it("prices should be within realistic bounds and non-negative", () => {
    for (const q of quotes) {
      expect(q.open).toBeGreaterThanOrEqual(50);
      expect(q.high).toBeGreaterThanOrEqual(q.low);
      expect(q.high).toBeLessThanOrEqual(500);
      expect(q.low).toBeGreaterThanOrEqual(50);
      expect(q.close).toBeGreaterThanOrEqual(50);
      expect(q.close).toBeLessThanOrEqual(500);
    }
  });

  it("should not contain scientific notation in numeric serialization for prices", () => {
    // Convert each to string and ensure no 'e' or 'E'
    for (const q of quotes) {
      for (const v of [q.open, q.high, q.low, q.close]) {
        const s = String(v);
        expect(/[eE]/.test(s)).toBe(false);
      }
    }
  });

  it("volumes should be positive integers", () => {
    for (const q of quotes) {
      expect(Number.isInteger(q.volume)).toBe(true);
      expect(q.volume).toBeGreaterThan(0);
    }
  });
});
