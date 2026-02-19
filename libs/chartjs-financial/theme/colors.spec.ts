import { describe, expect, it } from "vitest";

import { getFinancialPalette, getVolumeColor } from "./colors";

describe("financial colors", () => {
  it("returns complete palettes for both modes", () => {
    const dark = getFinancialPalette("dark");
    const light = getFinancialPalette("light");

    expect(dark.candle.up).toBeTruthy();
    expect(light.candle.up).toBeTruthy();
  });

  it("computes up/down/unchanged volume colors from open/close", () => {
    const palette = getFinancialPalette("light");

    expect(getVolumeColor(10, 11, palette)).toBe(palette.volume.up);
    expect(getVolumeColor(11, 10, palette)).toBe(palette.volume.down);
    expect(getVolumeColor(10, 10, palette)).toBe(palette.volume.unchanged);
  });
});
