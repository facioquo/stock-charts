import { describe, expect, it } from "vitest";

import { type CartesianScaleOptions, type Scale } from "chart.js";

import { baseOverlayOptions, formatVolume, volumeTickValues } from "./overlay";
import { type ChartSettings } from "./types";

const settings: ChartSettings = { isDarkTheme: true, showTooltips: true };

function volumeAxis(overrides: Partial<ChartSettings> = {}): CartesianScaleOptions {
  const axis = baseOverlayOptions(40_000_000, { ...settings, ...overrides }).scales?.["volumeAxis"];
  if (!axis) throw new Error("volume axis is not configured");
  return axis as CartesianScaleOptions;
}

describe("volumeTickValues", () => {
  it("labels one round level at or below an eighth of the axis max (issue #634)", () => {
    // Axis max is 20x the mean bar, so 40M means a 2M mean and a 5M ceiling.
    expect(volumeTickValues(40_000_000)).toEqual([5_000_000]);
    expect(volumeTickValues(20_000_000)).toEqual([2_000_000]);
    expect(volumeTickValues(9_000_000)).toEqual([1_000_000]);
  });

  it("stays at or under the ceiling for any axis max", () => {
    for (const max of [1, 7, 333, 12_345, 987_654_321]) {
      const [value] = volumeTickValues(max);
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThanOrEqual(max / 8);
    }
  });

  it("returns no ticks for an empty or invalid axis", () => {
    expect(volumeTickValues(0)).toEqual([]);
    expect(volumeTickValues(Number.NaN)).toEqual([]);
    expect(volumeTickValues(-10)).toEqual([]);
  });
});

describe("formatVolume", () => {
  it("abbreviates large quantities", () => {
    expect(formatVolume(12_000_000)).toBe("12M");
    expect(formatVolume(1_500_000)).toBe("1.5M");
    expect(formatVolume(500_000)).toBe("500K");
    expect(formatVolume(2_000_000_000)).toBe("2B");
  });
});

describe("baseOverlayOptions volume axis", () => {
  it("shows mirrored right-hand labels without gridlines or tick marks", () => {
    const axis = volumeAxis();
    expect(axis.display).toBe(true);
    expect(axis.position).toBe("right");
    expect(axis.ticks.mirror).toBe(true);
    expect(axis.grid.display).toBe(false);
    expect(axis.grid.drawTicks).toBe(false);
    expect(axis.max).toBe(40_000_000);
  });

  it("follows the right-axis label setting", () => {
    expect(volumeAxis({ showRightAxisLabels: false }).display).toBe(false);
  });

  it("replaces the generated ticks with the volume level", () => {
    const axis = volumeAxis();
    const scale = { max: 40_000_000, ticks: [{ value: 1 }] } as unknown as Scale;
    axis.afterBuildTicks?.(scale);
    expect(scale.ticks).toEqual([{ value: 5_000_000 }]);
  });
});
