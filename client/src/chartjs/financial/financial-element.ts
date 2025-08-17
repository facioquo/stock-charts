/**
 * Financial Element Base Class
 * 
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { Element } from "chart.js";

interface FinancialElementProps {
  x: number;
  y: number;
  base: number;
  width: number;
  height: number;
  low: number;
  high: number;
  open: number;
  close: number;
}

interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 */
function getBarBounds(bar: FinancialElement, useFinalPosition?: boolean): BoundingBox | false {
  const { x, y, base, width, height } = bar.getProps(
    ["x", "low", "high", "width", "height"],
    useFinalPosition
  ) as FinancialElementProps;

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

/**
 * Helper function to check if coordinates are within element bounds
 */
function inRange(
  bar: FinancialElement,
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
 * Base class for financial chart elements (candlestick, OHLC)
 */
export abstract class FinancialElement extends Element {
  declare x: number;
  declare y: number;
  declare base: number;
  declare width: number;
  declare low: number;
  declare high: number;
  declare open: number;
  declare close: number;

  getHeight(): number {
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
    return axis === "x" ? this.width / 2 : this.getHeight() / 2;
  }

  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, low, high } = this.getProps(["x", "low", "high"], useFinalPosition) as {
      x: number;
      low: number;
      high: number;
    };
    return {
      x,
      y: (high + low) / 2
    };
  }

  tooltipPosition(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, open, close } = this.getProps(["x", "open", "close"], useFinalPosition) as {
      x: number;
      open: number;
      close: number;
    };
    return {
      x,
      y: (open + close) / 2
    };
  }
}