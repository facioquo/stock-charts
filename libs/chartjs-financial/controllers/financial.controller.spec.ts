import { describe, expect, it } from "vitest";

import { FinancialController } from "./financial.controller";

interface ParsedBar {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

const iScale = { axis: "x" as const };
const vScale = {};

/**
 * `getMinMax` reads only `_cachedMeta`, so it can be exercised against a stub
 * rather than a live Chart.js instance and canvas.
 */
function minMax(parsed: ParsedBar[], scale: object = vScale): { min: number; max: number } {
  const stub = {
    _cachedMeta: { iScale, vScale, _parsed: parsed }
  } as unknown as FinancialController;

  return FinancialController.prototype.getMinMax.call(stub, scale);
}

function bar(x: number, o: number, h: number, l: number, c: number): ParsedBar {
  return { x, o, h, l, c };
}

/** Trailing all-NaN padding, as emitted by indy-charts `addExtraFinancialBars`. */
function padding(x: number): ParsedBar {
  return { x, o: NaN, h: NaN, l: NaN, c: NaN };
}

describe("FinancialController.getMinMax", () => {
  it("spans the low/high range of the value scale", () => {
    expect(minMax([bar(1, 100, 110, 95, 105), bar(2, 105, 120, 102, 118)])).toEqual({
      min: 95,
      max: 120
    });
  });

  it("returns first/last index values for the index scale", () => {
    expect(minMax([bar(10, 100, 110, 95, 105), bar(20, 105, 120, 102, 118)], iScale)).toEqual({
      min: 10,
      max: 20
    });
  });

  it("ignores trailing NaN padding bars", () => {
    // Regression: a single NaN low or high used to poison Math.min/Math.max,
    // leaving the scale unbounded so Chart.js fell back to 0-1 and clamped
    // every candle off-canvas (facioquo/stock-indicators-dotnet#2183).
    const parsed = [bar(1, 100, 110, 95, 105), bar(2, 105, 120, 102, 118), padding(3), padding(4)];

    expect(minMax(parsed)).toEqual({ min: 95, max: 120 });
  });

  it("ignores NaN gaps in the middle of a series", () => {
    const parsed = [bar(1, 100, 110, 95, 105), padding(2), bar(3, 105, 120, 102, 118)];

    expect(minMax(parsed)).toEqual({ min: 95, max: 120 });
  });

  it("falls back to 0-1 when every bar is non-finite", () => {
    expect(minMax([padding(1), padding(2), padding(3)])).toEqual({ min: 0, max: 1 });
  });

  it("falls back to 0-1 when there is too little data", () => {
    expect(minMax([bar(1, 100, 110, 95, 105)])).toEqual({ min: 0, max: 1 });
  });
});
