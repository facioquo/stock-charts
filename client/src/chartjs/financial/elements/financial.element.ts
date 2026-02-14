/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import { Element } from "chart.js";

import { inRange } from "../helpers/bar-bounds";
import type { FinancialBarLike } from "../helpers/bar-bounds";

export class FinancialElement extends Element {
  declare x: number;
  declare y: number;
  declare base: number;
  declare low: number;
  declare high: number;
  declare open: number;
  declare close: number;
  declare direction: "up" | "down" | "unchanged";
  declare width: number;

  height(): number {
    return this.base - this.y;
  }

  inRange(mouseX: number, mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this as unknown as FinancialBarLike, mouseX, mouseY, useFinalPosition);
  }

  inXRange(mouseX: number, useFinalPosition?: boolean): boolean {
    return inRange(this as unknown as FinancialBarLike, mouseX, null, useFinalPosition);
  }

  inYRange(mouseY: number, useFinalPosition?: boolean): boolean {
    return inRange(this as unknown as FinancialBarLike, null, mouseY, useFinalPosition);
  }

  getRange(axis: "x" | "y"): number {
    return axis === "x" ? this.width / 2 : this.height() / 2;
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
