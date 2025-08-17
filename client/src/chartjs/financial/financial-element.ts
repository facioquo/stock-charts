// Financial element base class
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Element } from "chart.js";
import { BarBounds, FinancialElementProps } from "./types";

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 */
function getBarBounds(bar: FinancialElement, useFinalPosition?: boolean): BarBounds {
  const { x, y, base, width, height } = bar.getProps(
    ["x", "low", "high", "width", "height"],
    useFinalPosition
  );

  let left: number, right: number, top: number, bottom: number, half: number;

  if ((bar as any).horizontal) {
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

function inRange(
  bar: FinancialElement | null,
  x: number | null,
  y: number | null,
  useFinalPosition?: boolean
): boolean {
  const skipX = x === null;
  const skipY = y === null;
  const bounds = !bar || (skipX && skipY) ? false : getBarBounds(bar, useFinalPosition);

  return Boolean(
    bounds &&
      (skipX || (x !== null && x >= bounds.left && x <= bounds.right)) &&
      (skipY || (y !== null && y >= bounds.top && y <= bounds.bottom))
  );
}

export class FinancialElement extends Element<FinancialElementProps> {
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

  getRange(axis: "x" | "y"): number {
    return axis === "x" ? this.width / 2 : this.height() / 2;
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