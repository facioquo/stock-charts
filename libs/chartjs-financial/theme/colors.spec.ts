import { describe, expect, it } from "vitest";

import { getFinancialPalette, getVolumeColor } from "./colors";

describe("financial colors", () => {
  it("returns complete palettes for both modes", () => {
    const dark = getFinancialPalette("dark");
    const light = getFinancialPalette("light");

    expect(dark.candle.up).toBeTruthy();
    expect(light.candle.up).toBeTruthy();
  });

  it("uses distinct dark-mode colors tuned for the dark surface, not a copy of light", () => {
    const dark = getFinancialPalette("dark");
    const light = getFinancialPalette("light");

    expect(dark.candle.up).not.toBe(light.candle.up);
    expect(dark.candle.down).not.toBe(light.candle.down);
    expect(dark.candle.unchanged).not.toBe(light.candle.unchanged);
    expect(dark.candleBorder.up).not.toBe(light.candleBorder.up);
    expect(dark.candleBorder.down).not.toBe(light.candleBorder.down);
    expect(dark.candleBorder.unchanged).not.toBe(light.candleBorder.unchanged);
    expect(dark.volume.up).not.toBe(light.volume.up);
    expect(dark.volume.down).not.toBe(light.volume.down);
    expect(dark.volume.unchanged).not.toBe(light.volume.unchanged);
  });

  it("computes up/down/unchanged volume colors from open/close", () => {
    const palette = getFinancialPalette("light");

    expect(getVolumeColor(10, 11, palette)).toBe(palette.volume.up);
    expect(getVolumeColor(11, 10, palette)).toBe(palette.volume.down);
    expect(getVolumeColor(10, 10, palette)).toBe(palette.volume.unchanged);
  });
});
