/**
 * Base financial element for Chart.js financial charts
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * 
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { Element } from "chart.js";

/**
 * Properties for getting bounds of a financial element
 */
interface BoundsProps {
  x: number;
  y: number;
  base: number;
  width: number;
  height: number;
  horizontal?: boolean;
}

/**
 * Bounds of a financial element
 */
interface ElementBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 */
function getBarBounds(bar: BoundsProps, useFinalPosition?: boolean): ElementBounds {
  const { x, y, base, width, height, horizontal } = bar;

  let left: number, right: number, top: number, bottom: number, half: number;

  if (horizontal) {
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
function inRange(element: FinancialElement, x: number | null, y: number | null, useFinalPosition?: boolean): boolean {
  const skipX = x === null;
  const skipY = y === null;
  const bounds = !element || (skipX && skipY) ? false : getBarBounds(element as unknown as BoundsProps, useFinalPosition);

  return Boolean(bounds
    && (skipX || (x !== null && x >= bounds.left && x <= bounds.right))
    && (skipY || (y !== null && y >= bounds.top && y <= bounds.bottom)));
}

/**
 * Base financial element class
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

  /**
   * Gets the height of the element
   */
  elementHeight(): number {
    return this.base - this.y;
  }

  /**
   * Checks if the given coordinates are within the element
   */
  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }

  /**
   * Checks if the X coordinate is within the element's X range
   */
  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    return inRange(this, mouseX, null, useFinalPosition);
  }

  /**
   * Checks if the Y coordinate is within the element's Y range
   */
  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this, null, mouseY, useFinalPosition);
  }

  /**
   * Gets the range for the specified axis
   */
  getRange(axis: "x" | "y"): number {
    return axis === "x" ? this.width / 2 : this.elementHeight() / 2;
  }

  /**
   * Gets the center point of the element
   */
  getCenterPoint(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, low, high } = this.getProps(["x", "low", "high"], useFinalPosition);
    return {
      x,
      y: (high + low) / 2
    };
  }

  /**
   * Gets the tooltip position (center of open/close range)
   */
  tooltipPosition(useFinalPosition?: boolean): { x: number; y: number } {
    const { x, open, close } = this.getProps(["x", "open", "close"], useFinalPosition);
    return {
      x,
      y: (open + close) / 2
    };
  }
}