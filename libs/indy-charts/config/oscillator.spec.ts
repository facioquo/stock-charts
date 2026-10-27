import { describe, expect, it } from "vitest";

import { type Tick } from "chart.js";

import { baseOscillatorOptions } from "./oscillator";
import { type ChartSettings } from "./types";

const settings: ChartSettings = { isDarkTheme: false, showTooltips: true };

// Return type inferred rather than restated: Chart.js declares a wider callback
// return than it looks (string[] and number[] included), and a hand-written
// alias silently drifts from it.
function yTickCallback() {
  const options = baseOscillatorOptions(settings);
  const y = options.scales?.["y"];
  const raw = y && "ticks" in y ? y.ticks?.callback : undefined;
  if (typeof raw !== "function") {
    throw new Error("y-axis tick callback is not configured");
  }
  // Chart.js declares the callback with `this: Scale`; the oscillator assigns an
  // arrow function, so there is no receiver. Widening it away here beats
  // fabricating a Scale at all thirteen call sites.
  const callback: OmitThisParameter<typeof raw> = raw;
  return callback;
}

function ticks(count: number): Tick[] {
  return Array.from({ length: count }, (_, i): Tick => ({ value: i }));
}

describe("baseOscillatorOptions", () => {
  it("hides the x-axis", () => {
    const options = baseOscillatorOptions(settings);
    expect(options.scales?.["x"]?.display).toBe(false);
  });

  describe("y-axis tick callback", () => {
    it("keeps boundary labels on short panes with few gridlines (issue #495)", () => {
      const callback = yTickCallback();
      const values = ticks(3);

      // first and last labels must remain visible so the axis range is readable
      expect(callback(0, 0, values)).not.toBeNull();
      expect(callback(2, 2, values)).not.toBeNull();
      expect(callback(1, 1, values)).not.toBeNull();
    });

    it("drops the first and last labels at exactly the threshold (4 ticks)", () => {
      const callback = yTickCallback();
      const values = ticks(4);

      expect(callback(0, 0, values)).toBeNull();
      expect(callback(3, 3, values)).toBeNull();
      // exactly two interior labels remain
      expect(callback(1, 1, values)).not.toBeNull();
      expect(callback(2, 2, values)).not.toBeNull();
    });

    it("drops the first and last labels once enough gridlines exist", () => {
      const callback = yTickCallback();
      const values = ticks(6);

      expect(callback(0, 0, values)).toBeNull();
      expect(callback(5, 5, values)).toBeNull();
      // interior labels remain
      expect(callback(2, 2, values)).not.toBeNull();
    });

    it("condenses large values with magnitude suffixes", () => {
      const callback = yTickCallback();

      const millions = [0, 10_000_000, 20_000_000, 30_000_000].map((value): Tick => ({ value }));
      expect(callback(20_000_000, 2, millions)).toBe("20M");
      const thousands = [0, 25_000, 50_000, 75_000].map((value): Tick => ({ value }));
      expect(callback(50_000, 2, thousands)).toBe("50K");
    });

    it("labels every tick in the unit of the axis's largest value", () => {
      const callback = yTickCallback();
      // A KVO-like axis: the largest tick is past 10M, so millions throughout.
      const values = [-15, -10, -5, 0, 5, 10, 15].map((m): Tick => ({ value: m * 1_000_000 }));

      expect(values.map((tick, i) => callback(tick.value, i, values))).toEqual([
        null,
        "-10M",
        "-5M",
        0,
        "5M",
        "10M",
        null
      ]);
      expect(callback(2_500_000, 3, values)).toBe("2.5M");
    });

    it("uses the largest unit the axis reaches", () => {
      const callback = yTickCallback();
      const billions = [-3, -2, -1, 0, 1].map((b): Tick => ({ value: b * 1_000_000_000 }));
      expect(callback(-2_000_000_000, 1, billions)).toBe("-2B");
      const thousands = [0, 10_000, 15_000, 20_000, 25_000].map((value): Tick => ({ value }));
      expect(callback(15_000, 2, thousands)).toBe("15K");
    });

    it("picks the unit from drawn labels, not a trimmed bound", () => {
      const callback = yTickCallback();
      // The 1,000,000 bound is dropped, so the drawn labels top out at 800K.
      const values = [0, 200_000, 400_000, 600_000, 800_000, 1_000_000].map((value): Tick => ({
        value
      }));

      expect(values.map((tick, i) => callback(tick.value, i, values))).toEqual([
        null,
        "200K",
        "400K",
        "600K",
        "800K",
        null
      ]);
    });

    it("keeps plain numbers on an axis in the low thousands", () => {
      const callback = yTickCallback();
      const values = [0, 2_000, 4_000, 6_000, 8_000, 10_000].map((value): Tick => ({ value }));

      expect(callback(6_000, 3, values)).toBe(6_000);
    });

    it.each([
      [10_000, "10K"],
      [1_000_000, "1M"],
      [1_000_000_000, "1B"]
    ])("switches unit when the largest drawn label is exactly %d", (largest, label) => {
      const callback = yTickCallback();
      const values = [0, largest / 2, largest].map((value): Tick => ({ value }));

      expect(callback(largest, 2, values)).toBe(label);
    });

    it("leaves small values unscaled", () => {
      const callback = yTickCallback();
      const values = [0, 25, 50, 75, 100].map((value): Tick => ({ value }));

      expect(callback(50, 2, values)).toBe(50);
    });
  });
});
