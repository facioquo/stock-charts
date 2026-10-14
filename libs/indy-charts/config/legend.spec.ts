import { describe, expect, it } from "vitest";

import {
  LEGEND_BOTTOM_GAP,
  LEGEND_ENTRY_GAP,
  LEGEND_ROW_HEIGHT,
  LEGEND_SWATCH_WIDTH,
  layoutLegend
} from "./legend";

const tenPixelsPerCharacter = (label: string): number => label.length * 10;

describe("layoutLegend", () => {
  it("reserves nothing without entries", () => {
    expect(layoutLegend([], tenPixelsPerCharacter, 400)).toEqual({ slots: [], height: 0 });
  });

  it("keeps entries inline on one row while they fit", () => {
    const { slots, height } = layoutLegend(["AAA", "BBB"], tenPixelsPerCharacter, 400);

    const first = LEGEND_SWATCH_WIDTH + 30;
    expect(slots).toEqual([
      { row: 0, x: 0 },
      { row: 0, x: first + LEGEND_ENTRY_GAP }
    ]);
    expect(height).toBe(LEGEND_ROW_HEIGHT + LEGEND_BOTTOM_GAP);
  });

  it("wraps an entry that would pass the width onto the next row", () => {
    const { slots, height } = layoutLegend(["AAAA", "BBBB", "CCCC"], tenPixelsPerCharacter, 120);

    expect(slots.map(s => s.row)).toEqual([0, 0, 1]);
    expect(slots[2]?.x).toBe(0);
    expect(height).toBe(2 * LEGEND_ROW_HEIGHT + LEGEND_BOTTOM_GAP);
  });

  it("puts an entry wider than the row alone on a row without looping", () => {
    const { slots } = layoutLegend(["A", "B".repeat(30), "C"], tenPixelsPerCharacter, 100);

    expect(slots.map(s => s.row)).toEqual([0, 1, 2]);
  });
});
