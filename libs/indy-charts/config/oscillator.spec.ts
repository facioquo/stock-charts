import { describe, expect, it } from "vitest";

import { type Tick } from "chart.js";

import { baseOscillatorOptions } from "./oscillator";
import { type ChartSettings } from "./types";

const settings: ChartSettings = { isDarkTheme: false, showTooltips: true };

type TickCallback = (
  value: string | number,
  index: number,
  ticks: Tick[]
) => string | number | null;

function yTickCallback(): TickCallback {
  const options = baseOscillatorOptions(settings);
  const y = options.scales?.["y"];
  const callback = y && "ticks" in y ? y.ticks.callback : undefined;
  if (typeof callback !== "function") {
    throw new Error("y-axis tick callback is not configured");
  }
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
      const values = ticks(6);

      expect(callback(20_000_000, 2, values)).toBe("20M");
      expect(callback(50_000, 3, values)).toBe("50K");
    });
  });
});
