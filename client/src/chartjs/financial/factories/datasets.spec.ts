import { describe, expect, it } from "vitest";

import { buildCandlestickDataset, buildVolumeDataset, toFinancialDataPoint } from "./datasets";
import { getFinancialPalette } from "../theme/colors";

describe("financial dataset factories", () => {
  it("converts quote to OHLC point shape", () => {
    const point = toFinancialDataPoint({
      date: new Date("2025-08-17T00:00:00.000Z"),
      open: 100,
      high: 110,
      low: 95,
      close: 105,
      volume: 5000
    });

    expect(point).toEqual({
      x: new Date("2025-08-17T00:00:00.000Z").valueOf(),
      o: 100,
      h: 110,
      l: 95,
      c: 105
    });
  });

  it("builds candlestick dataset with typed structure", () => {
    const palette = getFinancialPalette("light");
    const dataset = buildCandlestickDataset(
      [
        {
          x: 1,
          o: 10,
          h: 12,
          l: 9,
          c: 11
        }
      ],
      palette.candleBorder
    );

    expect(dataset.type).toBe("candlestick");
    expect(dataset.data).toHaveLength(1);
    expect(dataset.order).toBe(75);
  });

  it("builds volume dataset with up/down/unchanged colors and extra bars", () => {
    const palette = getFinancialPalette("light");
    const quotes = [
      {
        date: new Date("2025-08-17T00:00:00.000Z"),
        open: 100,
        high: 110,
        low: 95,
        close: 105,
        volume: 5000
      },
      {
        date: new Date("2025-08-18T00:00:00.000Z"),
        open: 105,
        high: 109,
        low: 98,
        close: 99,
        volume: 4000
      },
      {
        date: new Date("2025-08-19T00:00:00.000Z"),
        open: 99,
        high: 100,
        low: 95,
        close: 99,
        volume: 3500
      }
    ];

    const dataset = buildVolumeDataset(quotes, 3, palette);
    const colors = dataset.backgroundColor as string[];

    expect(dataset.type).toBe("bar");
    expect(dataset.data).toHaveLength(5);
    expect(colors).toEqual([
      palette.volume.up,
      palette.volume.down,
      palette.volume.unchanged,
      palette.volume.unchanged,
      palette.volume.unchanged
    ]);
  });
});
