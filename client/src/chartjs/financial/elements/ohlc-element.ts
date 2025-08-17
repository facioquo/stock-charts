/**
 * OHLC element for Chart.js financial charts
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { Chart } from "chart.js";
import { valueOrDefault, merge } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";

/**
 * OHLC element for rendering OHLC (Open-High-Low-Close) charts
 */
export class OhlcElement extends FinancialElement {
  static id = "ohlc";

  declare borderColor?: string;
  declare borderWidth?: number;

  /**
   * Draw the OHLC element
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, open, high, low, close } = this;

    const globalOpts = Chart.defaults;
    const ohlcDefaults = (globalOpts as any).elements?.ohlc;

    ctx.lineWidth = valueOrDefault(this.borderWidth, ohlcDefaults?.borderWidth ?? 1);
    ctx.strokeStyle = valueOrDefault(this.borderColor, ohlcDefaults?.borderColor ?? "#000000");

    ctx.beginPath();

    // Vertical line (high to low)
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);

    // Opening tick (left)
    ctx.moveTo(x - this.width / 2, open);
    ctx.lineTo(x, open);

    // Closing tick (right)
    ctx.moveTo(x, close);
    ctx.lineTo(x + this.width / 2, close);

    ctx.stroke();
    ctx.closePath();
  }
}

// Set up defaults for OhlcElement
OhlcElement.defaults = merge({}, [
  // Will be set up by the registration system
  {
    borderWidth: 1
  }
]);
