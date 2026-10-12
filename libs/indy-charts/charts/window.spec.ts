import { describe, expect, it } from "vitest";

import { MIN_BARS } from "../helpers/calculate-optimal-bars";
import { clampWindow, panWindow, zoomWindow } from "./window";

describe("clampWindow", () => {
  it("keeps a window that already fits", () => {
    expect(clampWindow(40, 50, 200)).toEqual({ start: 40, count: 50 });
  });

  it("clamps start at both history ends", () => {
    expect(clampWindow(-10, 50, 200)).toEqual({ start: 0, count: 50 });
    expect(clampWindow(190, 50, 200)).toEqual({ start: 150, count: 50 });
  });

  it("clamps count to [MIN_BARS, length]", () => {
    expect(clampWindow(0, 3, 200).count).toBe(MIN_BARS);
    expect(clampWindow(0, 999, 200)).toEqual({ start: 0, count: 200 });
  });

  it("shows the whole history when it is shorter than the minimum", () => {
    expect(clampWindow(5, 10, 8)).toEqual({ start: 0, count: 8 });
  });

  it("returns an empty window for an empty history", () => {
    expect(clampWindow(3, 50, 0)).toEqual({ start: 0, count: 0 });
  });

  it("falls back to the oldest bars and the minimum count for NaN", () => {
    expect(clampWindow(NaN, NaN, 200)).toEqual({ start: 0, count: MIN_BARS });
  });

  it("clamps an infinite start to the matching end of history", () => {
    expect(clampWindow(Infinity, 50, 200)).toEqual({ start: 150, count: 50 });
    expect(clampWindow(-Infinity, 50, 200)).toEqual({ start: 0, count: 50 });
  });

  it("clamps an infinite count to the whole history", () => {
    expect(clampWindow(0, Infinity, 200).count).toBe(200);
  });
});

describe("panWindow", () => {
  it("shifts by a signed number of bars", () => {
    expect(panWindow({ start: 100, count: 50 }, -30, 200)).toEqual({ start: 70, count: 50 });
    expect(panWindow({ start: 100, count: 50 }, 10, 200)).toEqual({ start: 110, count: 50 });
  });

  it("stops at the oldest bar", () => {
    expect(panWindow({ start: 10, count: 50 }, -100, 200)).toEqual({ start: 0, count: 50 });
  });

  it("stops at the newest bar", () => {
    expect(panWindow({ start: 140, count: 50 }, 100, 200)).toEqual({ start: 150, count: 50 });
  });

  it("ignores a NaN shift", () => {
    expect(panWindow({ start: 100, count: 50 }, NaN, 200)).toEqual({ start: 100, count: 50 });
  });

  it("takes an infinite shift to the matching end of history", () => {
    expect(panWindow({ start: 100, count: 50 }, Infinity, 200)).toEqual({ start: 150, count: 50 });
    expect(panWindow({ start: 100, count: 50 }, -Infinity, 200)).toEqual({ start: 0, count: 50 });
  });
});

describe("zoomWindow", () => {
  it("steps out by a bar for a factor too small to move a rounded count", () => {
    const out = zoomWindow({ start: 100, count: 30 }, 1.01, 0.5, 400);
    expect(out.count).toBe(31);
    // ...and zooming back in returns to where it began.
    expect(zoomWindow(out, 0.99, 0.5, 400).count).toBe(30);
  });

  it("zooms out around the middle by default anchor", () => {
    // anchor bar = 100 + 0.5 * 50 = 125 → start = 125 - 0.5 * 100 = 75
    expect(zoomWindow({ start: 100, count: 50 }, 2, 0.5, 400)).toEqual({ start: 75, count: 100 });
  });

  it("keeps the anchor bar at the same fraction across the window", () => {
    const before = { start: 100, count: 60 };
    const anchor = 0.25;
    const after = zoomWindow(before, 0.5, anchor, 400);

    expect(after.count).toBe(30);
    const drift = after.start + anchor * after.count - (before.start + anchor * before.count);
    expect(Math.abs(drift)).toBeLessThanOrEqual(0.5); // start rounds to a whole bar
  });

  it("pins the left edge when anchored at 0 and the right edge at 1", () => {
    const before = { start: 100, count: 40 };

    expect(zoomWindow(before, 2, 0, 400)).toEqual({ start: 100, count: 80 });
    expect(zoomWindow(before, 2, 1, 400)).toEqual({ start: 60, count: 80 });
  });

  it("stops zooming in at MIN_BARS", () => {
    expect(zoomWindow({ start: 100, count: 30 }, 0.1, 0.5, 400).count).toBe(MIN_BARS);
  });

  it("stops zooming out at the history length and clamps start", () => {
    expect(zoomWindow({ start: 100, count: 50 }, 100, 0.5, 200)).toEqual({ start: 0, count: 200 });
  });

  it("pulls start back inside the history when zooming out near an end", () => {
    // Anchor 0 keeps bar 150 at the left edge, so start 150 with count 100 would
    // run past the end: it is pulled back to 100.
    expect(zoomWindow({ start: 150, count: 50 }, 2, 0, 200)).toEqual({ start: 100, count: 100 });
    // Anchor 1 keeps bar 200 at the right edge: start 200 - 100 = 100, in range.
    expect(zoomWindow({ start: 150, count: 50 }, 2, 1, 200)).toEqual({ start: 100, count: 100 });
    // Anchor 1 near the oldest end computes start 60 - 100 = -40 and clamps to 0.
    expect(zoomWindow({ start: 10, count: 50 }, 2, 1, 200)).toEqual({ start: 0, count: 100 });
  });

  it("leaves the window unchanged for a non-positive or NaN factor", () => {
    expect(zoomWindow({ start: 100, count: 50 }, 0, 0.5, 400)).toEqual({ start: 100, count: 50 });
    expect(zoomWindow({ start: 100, count: 50 }, NaN, 0.5, 400)).toEqual({ start: 100, count: 50 });
  });

  it("zooms out to the whole history for an infinite factor", () => {
    expect(zoomWindow({ start: 100, count: 50 }, Infinity, 0.5, 400)).toEqual({
      start: 0,
      count: 400
    });
  });

  it("clamps an infinite anchor to the matching edge of the window", () => {
    const before = { start: 100, count: 50 };
    expect(zoomWindow(before, 2, Infinity, 400)).toEqual(zoomWindow(before, 2, 1, 400));
    expect(zoomWindow(before, 2, -Infinity, 400)).toEqual(zoomWindow(before, 2, 0, 400));
  });
});
