/**
 * Candlestick element for Chart.js financial charts
 * Based on chartjs-chart-financial plugin
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 *
 * Licensed under MIT License
 * Copyright (c) 2018 Chart.js Contributors
 */

import { Chart } from "chart.js";
import { valueOrDefault, merge } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorConfig } from "../colors";

/**
 * Candlestick element for rendering candlestick charts
 */
export class CandlestickElement extends FinancialElement {
  static id = "candlestick";

  declare color?: FinancialColorConfig;
  declare borderColor?: string | FinancialColorConfig;
  declare borderWidth?: number;

  /**
   * Draw the candlestick element
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, open, high, low, close } = this;

    let borderColors = this.borderColor;
    if (typeof borderColors === "string") {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    const globalOpts = Chart.defaults;
    const candlestickDefaults = (globalOpts as any).elements?.candlestick;
    const financialDefaults = (globalOpts as any).elements?.financial;

    let borderColor: string;
    if (close < open) {
      borderColor = valueOrDefault(
        borderColors?.up,
        candlestickDefaults?.borderColor ?? financialDefaults?.color?.up ?? "#000000"
      );
      ctx.fillStyle = valueOrDefault(
        this.color?.up,
        candlestickDefaults?.color?.up ?? financialDefaults?.color?.up ?? "#000000"
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors?.down,
        candlestickDefaults?.borderColor ?? financialDefaults?.color?.down ?? "#000000"
      );
      ctx.fillStyle = valueOrDefault(
        this.color?.down,
        candlestickDefaults?.color?.down ?? financialDefaults?.color?.down ?? "#000000"
      );
    } else {
      borderColor = valueOrDefault(
        borderColors?.unchanged,
        candlestickDefaults?.borderColor ?? financialDefaults?.color?.unchanged ?? "#000000"
      );
      ctx.fillStyle = valueOrDefault(
        this.color?.unchanged,
        candlestickDefaults?.color?.unchanged ?? financialDefaults?.color?.unchanged ?? "#000000"
      );
    }

    ctx.lineWidth = valueOrDefault(this.borderWidth, candlestickDefaults?.borderWidth ?? 1);
    ctx.strokeStyle = borderColor;

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();
    ctx.fillRect(x - this.width / 2, close, this.width, open - close);
    ctx.strokeRect(x - this.width / 2, close, this.width, open - close);
    ctx.closePath();
  }
}

// Set up defaults for CandlestickElement
CandlestickElement.defaults = merge({}, [
  // Will be set up by the registration system
  {
    borderWidth: 1
  }
]);
