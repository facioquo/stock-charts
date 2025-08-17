// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// CandlestickElement implementation

import { Chart } from "chart.js";
import { merge, valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorConfig } from "./types";
import { DEFAULT_FINANCIAL_COLORS } from "./colors";

/**
 * Candlestick chart element for drawing individual candlestick bars
 */
export class CandlestickElement extends FinancialElement {
  static id = "candlestick";

  declare borderColor: string | FinancialColorConfig;
  declare borderWidth: number;
  declare color: FinancialColorConfig;

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;
    const { x, open, high, low, close } = me;

    let borderColors = me.borderColor;
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
        borderColors ? (borderColors as FinancialColorConfig).up : undefined,
        DEFAULT_FINANCIAL_COLORS.up
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.up : undefined,
        DEFAULT_FINANCIAL_COLORS.up
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors ? (borderColors as FinancialColorConfig).down : undefined,
        DEFAULT_FINANCIAL_COLORS.down
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.down : undefined,
        DEFAULT_FINANCIAL_COLORS.down
      );
    } else {
      borderColor = valueOrDefault(
        borderColors ? (borderColors as FinancialColorConfig).unchanged : undefined,
        DEFAULT_FINANCIAL_COLORS.unchanged
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.unchanged : undefined,
        DEFAULT_FINANCIAL_COLORS.unchanged
      );
    }

    ctx.lineWidth = valueOrDefault(me.borderWidth, 1);
    ctx.strokeStyle = valueOrDefault(borderColor, DEFAULT_FINANCIAL_COLORS.unchanged);

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();
    ctx.fillRect(x - me.width / 2, close, me.width, open - close);
    ctx.strokeRect(x - me.width / 2, close, me.width, open - close);
    ctx.closePath();
  }
}

// Set up defaults
CandlestickElement.defaults = merge({}, [
  {
    borderColor: DEFAULT_FINANCIAL_COLORS.unchanged,
    borderWidth: 1
  }
]);
