/**
 * Candlestick Element
 * 
 * Based on chartjs-chart-financial
 * Original source: https://github.com/chartjs/chartjs-chart-financial
 * Version: Latest available
 * License: MIT (original upstream license)
 */

import { Chart } from "chart.js";
import { merge, valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";

interface ColorConfig {
  up: string;
  down: string;
  unchanged: string;
}

interface BorderColorConfig extends ColorConfig {}

/**
 * Candlestick chart element for drawing individual candlestick bars
 */
export class CandlestickElement extends FinancialElement {
  static id = "candlestick";
  
  declare color?: ColorConfig;
  declare borderColor?: BorderColorConfig | string;
  declare borderWidth?: number;

  static defaults = merge({}, [
    (Chart.defaults.elements as any).financial || {},
    {
      borderColor: "#616161",
      borderWidth: 1
    }
  ]);

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;
    const { x, open, high, low, close } = me;
    const globalOpts = Chart.defaults;
    const elements = globalOpts.elements as any;

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
        borderColors ? (borderColors as BorderColorConfig).up : undefined,
        elements.candlestick?.borderColor || elements.financial?.color?.unchanged || "#616161"
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.up : undefined,
        elements.candlestick?.color?.up || elements.financial?.color?.up || "#1B5E20"
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors ? (borderColors as BorderColorConfig).down : undefined,
        elements.candlestick?.borderColor || elements.financial?.color?.unchanged || "#616161"
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.down : undefined,
        elements.candlestick?.color?.down || elements.financial?.color?.down || "#B71C1C"
      );
    } else {
      borderColor = valueOrDefault(
        borderColors ? (borderColors as BorderColorConfig).unchanged : undefined,
        elements.candlestick?.borderColor || elements.financial?.color?.unchanged || "#616161"
      );
      ctx.fillStyle = valueOrDefault(
        me.color ? me.color.unchanged : undefined,
        elements.candlestick?.color?.unchanged || elements.financial?.color?.unchanged || "#616161"
      );
    }

    ctx.lineWidth = valueOrDefault(
      me.borderWidth,
      elements.candlestick?.borderWidth || 1
    );
    ctx.strokeStyle = valueOrDefault(borderColor, "#616161");

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