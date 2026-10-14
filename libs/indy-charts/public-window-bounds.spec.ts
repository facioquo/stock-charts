import { describe, expect, it } from "vitest";

import { MIN_BARS, clampWindow } from "./index";

describe("window bounds in the public surface", () => {
  it("publishes the minimum count a window request clamps to", () => {
    expect(MIN_BARS).toBe(20);
  });

  it("reports the window a request becomes", () => {
    expect(clampWindow(-10, 400, 502)).toEqual({ start: 0, count: 400 });
    expect(clampWindow(300, 400, 502)).toEqual({ start: 102, count: 400 });
    expect(clampWindow(0, 5, 502).count).toBe(MIN_BARS);
  });

  it("shows a history shorter than the minimum whole", () => {
    expect(clampWindow(3, 50, 12)).toEqual({ start: 0, count: 12 });
  });

  it("reports an empty window for an empty history", () => {
    expect(clampWindow(10, 50, 0)).toEqual({ start: 0, count: 0 });
  });

  it("treats a non-finite start or count as the oldest start and the minimum count", () => {
    expect(clampWindow(Number.NaN, Number.NaN, 502)).toEqual({ start: 0, count: MIN_BARS });
  });
});
