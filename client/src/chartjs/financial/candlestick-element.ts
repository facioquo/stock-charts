// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { Chart } from "chart.js";
import { merge, valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorConfig } from "./types";

const globalOpts = Chart.defaults;

/**
 * Candlestick chart element
 */
export class CandlestickElement extends FinancialElement {
  static readonly id = "candlestick";

  declare borderColor: string | FinancialColorConfig;
  declare color: FinancialColorConfig;
  declare borderWidth: number;

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

    let borderColor: string;
    if (close < open) {
      borderColor = valueOrDefault(
        borderColors ? borderColors.up : undefined, 
        (globalOpts.elements as any).candlestick.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        this.color ? this.color.up : undefined, 
        (globalOpts.elements as any).candlestick.color.up
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors ? borderColors.down : undefined, 
        (globalOpts.elements as any).candlestick.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        this.color ? this.color.down : undefined, 
        (globalOpts.elements as any).candlestick.color.down
      );
    } else {
      borderColor = valueOrDefault(
        borderColors ? borderColors.unchanged : undefined, 
        (globalOpts.elements as any).candlestick.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        this.color ? this.color.unchanged : undefined, 
        (globalOpts.elements as any).candlestick.color.unchanged
      );
    }

    ctx.lineWidth = valueOrDefault(this.borderWidth, (globalOpts.elements as any).candlestick.borderWidth);
    ctx.strokeStyle = valueOrDefault(borderColor, (globalOpts.elements as any).candlestick.borderColor);

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

  static readonly defaults = merge({}, [(globalOpts.elements as any).financial, {
    borderColor: (globalOpts.elements as any).financial.color.unchanged,
    borderWidth: 1
  }]);
}