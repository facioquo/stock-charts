/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import { defaults } from "chart.js";
import { valueOrDefault } from "chart.js/helpers";

import { FinancialElement } from "./financial.element";
import { FinancialColorSet } from "../types/financial.types";

interface CandlestickElementLike extends FinancialElement {
  color?: FinancialColorSet;
  borderColor?: FinancialColorSet | string;
  borderWidth?: number;
}

export class CandlestickElement extends FinancialElement {
  static id = "candlestick";

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this as CandlestickElementLike;
    const { x, open, high, low, close } = me;

    let borderColors = me.borderColor;
    if (typeof borderColors === "string") {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    const candleDefaults = (defaults.elements as unknown as { candlestick: CandlestickElementLike })
      .candlestick;

    const isUp = me.direction === "up" || (me.direction == null && close < open);
    const isDown = me.direction === "down" || (me.direction == null && close > open);

    let borderColor: string | undefined;
    if (isUp) {
      borderColor = valueOrDefault(
        borderColors?.up,
        (candleDefaults.borderColor as FinancialColorSet)?.up
      );
      ctx.fillStyle = valueOrDefault(me.color?.up, candleDefaults.color?.up) ?? "#000000";
    } else if (isDown) {
      borderColor = valueOrDefault(
        borderColors?.down,
        (candleDefaults.borderColor as FinancialColorSet)?.down
      );
      ctx.fillStyle = valueOrDefault(me.color?.down, candleDefaults.color?.down) ?? "#000000";
    } else {
      borderColor = valueOrDefault(
        borderColors?.unchanged,
        (candleDefaults.borderColor as FinancialColorSet)?.unchanged
      );
      ctx.fillStyle =
        valueOrDefault(me.color?.unchanged, candleDefaults.color?.unchanged) ?? "#000000";
    }

    ctx.lineWidth = valueOrDefault(me.borderWidth, candleDefaults.borderWidth ?? 1);
    const resolvedStroke = valueOrDefault(borderColor, candleDefaults.borderColor);
    ctx.strokeStyle =
      typeof resolvedStroke === "string"
        ? resolvedStroke
        : (resolvedStroke?.unchanged ?? "#000000");

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();

    // Draw candle body
    // Apply pixel-alignment for crisp 1px borders
    // Offset by half the line width to align stroke to pixel boundaries
    const halfBorder = ctx.lineWidth / 2;
    const bodyX = x - me.width / 2 + halfBorder;
    const bodyY = close + halfBorder;
    const bodyW = me.width - ctx.lineWidth;
    const bodyH = open - close - ctx.lineWidth;
    ctx.fillRect(bodyX, bodyY, bodyW, bodyH);
    ctx.strokeRect(bodyX, bodyY, bodyW, bodyH);

    ctx.closePath();
  }
}
