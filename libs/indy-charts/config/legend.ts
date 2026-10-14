/** Width of the colour swatch glyph plus the gap before its label. */
export const LEGEND_SWATCH_WIDTH = 14;

/** Horizontal gap between entries on one row. */
export const LEGEND_ENTRY_GAP = 12;

/** Height of one legend row in pixels. */
export const LEGEND_ROW_HEIGHT = 15;

/** Space between the last legend row and the plot area. */
export const LEGEND_BOTTOM_GAP = 4;

export interface LegendSlot {
  /** Zero-based row, counted from the top of the legend block. */
  row: number;
  /** Left edge of the entry's swatch, in pixels from the plot's left edge. */
  x: number;
}

export interface LegendLayout {
  slots: LegendSlot[];
  /** Pixels the legend block reserves above the plot area; 0 with no entries. */
  height: number;
}

/**
 * Flow legend entries left to right and wrap to a new row when the next entry
 * would pass `maxWidth`. An entry wider than a whole row sits alone on its row.
 */
export function layoutLegend(
  labels: readonly string[],
  measure: (label: string) => number,
  maxWidth: number
): LegendLayout {
  if (labels.length === 0) return { slots: [], height: 0 };

  const slots: LegendSlot[] = [];
  let row = 0;
  let x = 0;

  for (const label of labels) {
    const width = LEGEND_SWATCH_WIDTH + measure(label);
    if (x > 0 && x + width > maxWidth) {
      row += 1;
      x = 0;
    }
    slots.push({ row, x });
    x += width + LEGEND_ENTRY_GAP;
  }

  return { slots, height: (row + 1) * LEGEND_ROW_HEIGHT + LEGEND_BOTTOM_GAP };
}
