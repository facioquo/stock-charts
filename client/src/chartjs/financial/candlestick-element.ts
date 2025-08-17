// Candlestick chart element
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Chart, ChartComponent } from "chart.js";
import { valueOrDefault, merge } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorOptions } from "./types";

interface CandlestickElementProps {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  width: number;
  borderWidth?: number;
  borderColor?: string | FinancialColorOptions;
  color?: FinancialColorOptions;
}

export class CandlestickElement extends FinancialElement {
  static readonly id = "candlestick";
  static readonly defaults: any;

  declare borderWidth?: number;
  declare borderColor?: string | FinancialColorOptions;
  declare color?: FinancialColorOptions;

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;
    const { x, open, high, low, close } = me;

    // Use default values since Chart.js defaults might not be set yet
    const defaultColors = {
      up: "rgba(80, 160, 115, 1)",
      down: "rgba(215, 85, 65, 1)",
      unchanged: "rgba(90, 90, 90, 1)"
    };
    
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
        borderColors?.up,
        defaultColors.unchanged
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.up,
        defaultColors.up
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors?.down,
        defaultColors.unchanged
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.down,
        defaultColors.down
      );
    } else {
      borderColor = valueOrDefault(
        borderColors?.unchanged,
        defaultColors.unchanged
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.unchanged,
        defaultColors.unchanged
      );
    }

    ctx.lineWidth = valueOrDefault(me.borderWidth, 1);
    ctx.strokeStyle = valueOrDefault(borderColor, defaultColors.unchanged);

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

// Initialize defaults as a static property
(CandlestickElement as any).defaults = {
  borderWidth: 1
};

// Export component interface for registration
export const CandlestickElementComponent: ChartComponent = CandlestickElement as any;