import { describe, expect, it } from "vitest";

import { COLORS, getFinancialPalette, getVolumeColor } from "./colors";

describe("financial colors", () => {
  it("returns complete palettes for both modes", () => {
    const dark = getFinancialPalette("dark");
    const light = getFinancialPalette("light");

    expect(dark.candle.up).toBeTruthy();
    expect(light.candle.up).toBeTruthy();
  });

  it("resolves the dark palette from its own constants", () => {
    const dark = getFinancialPalette("dark");

    // Dark mode intentionally shares light mode's hues today; these assertions
    // pin the dark palette to DARK_* so a future retune is a deliberate edit.
    expect(dark.candle.up).toBe(COLORS.DARK_CANDLE_UP);
    expect(dark.candle.down).toBe(COLORS.DARK_CANDLE_DOWN);
    expect(dark.candle.unchanged).toBe(COLORS.DARK_CANDLE_UNCHANGED);
    expect(dark.candleBorder.up).toBe(COLORS.DARK_CANDLE_UP);
    expect(dark.candleBorder.down).toBe(COLORS.DARK_CANDLE_DOWN);
    expect(dark.candleBorder.unchanged).toBe(COLORS.DARK_CANDLE_UNCHANGED);
    expect(dark.volume.up).toBe(COLORS.DARK_VOLUME_UP);
    expect(dark.volume.down).toBe(COLORS.DARK_VOLUME_DOWN);
    expect(dark.volume.unchanged).toBe(COLORS.DARK_VOLUME_UNCHANGED);
  });

  it("never resolves the dark palette through light-mode constants", () => {
    const light = getFinancialPalette("light");

    expect(light.candle.up).toBe(COLORS.CANDLE_UP);
    expect(light.candle.down).toBe(COLORS.CANDLE_DOWN);
    expect(light.candle.unchanged).toBe(COLORS.CANDLE_UNCHANGED);
    expect(light.candleBorder.up).toBe(COLORS.CANDLE_UP);
    expect(light.candleBorder.down).toBe(COLORS.CANDLE_DOWN);
    expect(light.candleBorder.unchanged).toBe(COLORS.CANDLE_UNCHANGED);
    expect(light.volume.up).toBe(COLORS.VOLUME_UP);
    expect(light.volume.down).toBe(COLORS.VOLUME_DOWN);
    expect(light.volume.unchanged).toBe(COLORS.VOLUME_UNCHANGED);
  });

  it("computes up/down/unchanged volume colors from open/close in dark mode", () => {
    const dark = getFinancialPalette("dark");

    expect(getVolumeColor(10, 11, dark)).toBe(dark.volume.up);
    expect(getVolumeColor(11, 10, dark)).toBe(dark.volume.down);
    expect(getVolumeColor(10, 10, dark)).toBe(dark.volume.unchanged);
  });

  it("computes up/down/unchanged volume colors from open/close", () => {
    const palette = getFinancialPalette("light");

    expect(getVolumeColor(10, 11, palette)).toBe(palette.volume.up);
    expect(getVolumeColor(11, 10, palette)).toBe(palette.volume.down);
    expect(getVolumeColor(10, 10, palette)).toBe(palette.volume.unchanged);
  });
});
