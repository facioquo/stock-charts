// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// FinancialElement base class for OHLC and Candlestick elements

import { Element } from "chart.js";

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 * @param bar the bar element
 * @param useFinalPosition whether to use final position
 * @returns bounds of the bar
 */
function getBarBounds(
  bar: { getProps: (props: string[], useFinal?: boolean) => Record<string, number>; horizontal?: boolean },
  useFinalPosition?: boolean
) {
  const { x, y, base, width, height } = bar.getProps(
    ["x", "low", "high", "width", "height"],
    useFinalPosition
  );

  let left: number, right: number, top: number, bottom: number, half: number;

  if (bar.horizontal) {
    half = height / 2;
    left = Math.min(x, base);
    right = Math.max(x, base);
    top = y - half;
    bottom = y + half;
  } else {
    half = width / 2;
    left = x - half;
    right = x + half;
    top = Math.min(y, base); // use min because 0 pixel at top of screen
    bottom = Math.max(y, base);
  }

  return { left, top, right, bottom };
}

/**
 * Check if point is in range of the bar
 */
function inRange(
  bar: { getProps: (props: string[], useFinal?: boolean) => Record<string, number> } | null,
  x: number | null,
  y: number | null,
  useFinalPosition?: boolean
): boolean {
  const skipX = x === null;
  const skipY = y === null;
  const bounds = !bar || (skipX && skipY) ? false : getBarBounds(bar, useFinalPosition);

  return (
    bounds &&
    (skipX || (x !== null && x >= bounds.left && x <= bounds.right)) &&
    (skipY || (y !== null && y >= bounds.top && y <= bounds.bottom))
  );
}

/**
 * Base class for financial chart elements (OHLC and Candlestick)
 */
export class FinancialElement extends Element {
  declare x: number;
  declare y: number;
  declare base: number;
  declare width: number;
  declare open: number;
  declare high: number;
  declare low: number;
  declare close: number;

  height(): number {
    return this.base - this.y;
  }

  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }

  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    return inRange(this, mouseX, null, useFinalPosition);
  }

  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this, null, mouseY, useFinalPosition);
  }

  getRange(axis: string): number {
    return axis === "x" ? (this.width || 0) / 2 : this.height() || 0;
  }

  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, low, high } = this.getProps(["x", "low", "high"], useFinalPosition);
    return {
      x,
      y: (high + low) / 2
    };
  }

  tooltipPosition(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, open, close } = this.getProps(["x", "open", "close"], useFinalPosition);
    return {
      x,
      y: (open + close) / 2
    };
  }
}
