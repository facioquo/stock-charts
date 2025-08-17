// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickElement - visual element for candlestick bars

import { Chart } from "chart.js";
import { valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import type { FinancialColorConfig } from "./types";

/**
 * Default configuration for candlestick elements
 */
const CANDLESTICK_DEFAULTS = {
  borderWidth: 1,
  backgroundColors: {
    up: "rgba(75, 192, 192, 0.5)",
    down: "rgba(255, 99, 132, 0.5)",
    unchanged: "rgba(201, 203, 207, 0.5)"
  } as FinancialColorConfig,
  borderColors: {
    up: "rgb(75, 192, 192)",
    down: "rgb(255, 99, 132)",
    unchanged: "rgb(201, 203, 207)"
  } as FinancialColorConfig
};

/**
 * Candlestick Element - renders individual candlestick bars
 * Extends FinancialElement with candlestick-specific drawing logic
 */
export class CandlestickElement extends FinancialElement {
  static readonly id = "candlestick" as const;

  static defaults = CANDLESTICK_DEFAULTS;

  /**
   * Draw the candlestick element with optimized rendering
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, open, high, low, close } = this;

    // Get defaults with fallback
    const defaults = CANDLESTICK_DEFAULTS;

    // Handle border colors (can be string or object)
    let borderColors = (this.options as any)?.borderColors;
    if (typeof borderColors === "string") {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    // Determine colors based on price movement
    let borderColor: string;
    let fillColor: string;

    if (close < open) {
      // Bearish (down) candle
      borderColor = valueOrDefault(borderColors?.up, defaults.borderColors.up);
      fillColor = valueOrDefault((this.options as any)?.backgroundColors?.up, defaults.backgroundColors.up);
    } else if (close > open) {
      // Bullish (up) candle
      borderColor = valueOrDefault(borderColors?.down, defaults.borderColors.down);
      fillColor = valueOrDefault(
        (this.options as any)?.backgroundColors?.down,
        defaults.backgroundColors.down
      );
    } else {
      // Unchanged (doji) candle
      borderColor = valueOrDefault(borderColors?.unchanged, defaults.borderColors.unchanged);
      fillColor = valueOrDefault(
        (this.options as any)?.backgroundColors?.unchanged,
        defaults.backgroundColors.unchanged
      );
    }

    // Set drawing properties
    ctx.lineWidth = valueOrDefault(
      (this.options as any)?.borderWidth,
      defaults.borderWidth
    );
    ctx.strokeStyle = borderColor;
    ctx.fillStyle = fillColor;

    // Calculate candle body dimensions
    const halfWidth = (this.width ?? 0) / 2;
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);
    const bodyHeight = bodyBottom - bodyTop;

    // Draw the candlestick
    ctx.beginPath();

    // Upper wick (high to body top)
    ctx.moveTo(x, high);
    ctx.lineTo(x, bodyTop);

    // Lower wick (body bottom to low)
    ctx.moveTo(x, bodyBottom);
    ctx.lineTo(x, low);

    ctx.stroke();

    // Draw candle body (rectangle)
    if (bodyHeight > 0) {
      ctx.fillRect(x - halfWidth, bodyTop, this.width ?? 0, bodyHeight);
      ctx.strokeRect(x - halfWidth, bodyTop, this.width ?? 0, bodyHeight);
    }

    ctx.closePath();
  }
}
