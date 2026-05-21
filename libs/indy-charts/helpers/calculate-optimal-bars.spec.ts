import { describe, expect, it } from "vitest";

import { calculateOptimalBars } from "./calculate-optimal-bars";

describe("calculateOptimalBars", () => {
  it("returns floor(width / pixelsPerBar) for typical widths", () => {
    // 1920 / 5 = 384, but max is 250
    expect(calculateOptimalBars(1920)).toBe(250);
  });

  it("clamps to minimum of 20 bars for narrow containers", () => {
    // 50 / 5 = 10, but min is 20
    expect(calculateOptimalBars(50)).toBe(20);
  });

  it("clamps to maximum of 250 bars for very wide containers", () => {
    // 5000 / 5 = 1000, but max is 250
    expect(calculateOptimalBars(5000)).toBe(250);
  });

  it("returns exactly 20 at the minimum boundary", () => {
    // 100 / 5 = 20
    expect(calculateOptimalBars(100)).toBe(20);
  });

  it("returns exactly 250 at the maximum boundary", () => {
    // 1250 / 5 = 250
    expect(calculateOptimalBars(1250)).toBe(250);
  });

  it("accepts a custom pixelsPerBar argument", () => {
    // 1920 / 10 = 192
    expect(calculateOptimalBars(1920, 10)).toBe(192);
  });

  it("handles width of 0", () => {
    expect(calculateOptimalBars(0)).toBe(20);
  });

  it("common laptop width (1366px)", () => {
    // 1366 / 5 = 273.2 → clamped to max 250
    expect(calculateOptimalBars(1366)).toBe(250);
  });

  it("tablet width (768px)", () => {
    // 768 / 5 = 153.6 → floor = 153
    expect(calculateOptimalBars(768)).toBe(153);
  });

  it("mobile width (375px)", () => {
    // 375 / 5 = 75
    expect(calculateOptimalBars(375)).toBe(75);
  });

  it("falls back to default pixelsPerBar when 0 is provided", () => {
    // 0 is non-positive → default (5); 1920 / 5 = 384, but max is 250
    expect(calculateOptimalBars(1920, 0)).toBe(250);
  });

  it("falls back to default pixelsPerBar for negative values", () => {
    expect(calculateOptimalBars(1920, -3)).toBe(250);
  });

  it("falls back to default pixelsPerBar for NaN", () => {
    expect(calculateOptimalBars(1920, NaN)).toBe(250);
  });

  it("falls back to default pixelsPerBar for Infinity", () => {
    expect(calculateOptimalBars(1920, Infinity)).toBe(250);
  });

  it("returns minimum bars for negative containerWidth", () => {
    expect(calculateOptimalBars(-100)).toBe(20);
  });

  it("returns minimum bars for NaN containerWidth", () => {
    expect(calculateOptimalBars(NaN)).toBe(20);
  });

  it("returns minimum bars for Infinity containerWidth", () => {
    expect(calculateOptimalBars(Infinity)).toBe(20);
  });
});
