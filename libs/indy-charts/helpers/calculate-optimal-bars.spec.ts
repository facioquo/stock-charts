import { describe, expect, it } from "vitest";

import { calculateOptimalBars } from "./calculate-optimal-bars";

describe("calculateOptimalBars", () => {
  it("returns floor(width / pixelsPerBar) for typical widths", () => {
    // 1920 / 5 = 384
    expect(calculateOptimalBars(1920)).toBe(384);
  });

  it("clamps to minimum of 20 bars for narrow containers", () => {
    // 50 / 5 = 10, but min is 20
    expect(calculateOptimalBars(50)).toBe(20);
  });

  it("clamps to maximum of 500 bars for very wide containers", () => {
    // 5000 / 5 = 1000, but max is 500
    expect(calculateOptimalBars(5000)).toBe(500);
  });

  it("returns exactly 20 at the minimum boundary", () => {
    // 100 / 5 = 20
    expect(calculateOptimalBars(100)).toBe(20);
  });

  it("returns exactly 500 at the maximum boundary", () => {
    // 2500 / 5 = 500
    expect(calculateOptimalBars(2500)).toBe(500);
  });

  it("accepts a custom pixelsPerBar argument", () => {
    // 1920 / 10 = 192
    expect(calculateOptimalBars(1920, 10)).toBe(192);
  });

  it("handles width of 0", () => {
    expect(calculateOptimalBars(0)).toBe(20);
  });

  it("common laptop width (1366px)", () => {
    // 1366 / 5 = 273.2 → floor = 273
    expect(calculateOptimalBars(1366)).toBe(273);
  });

  it("tablet width (768px)", () => {
    // 768 / 5 = 153.6 → floor = 153
    expect(calculateOptimalBars(768)).toBe(153);
  });

  it("mobile width (375px)", () => {
    // 375 / 5 = 75
    expect(calculateOptimalBars(375)).toBe(75);
  });
});
