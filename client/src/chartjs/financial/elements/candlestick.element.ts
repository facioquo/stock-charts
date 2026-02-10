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

    const borderWidth = valueOrDefault(me.borderWidth, candleDefaults.borderWidth ?? 1);
    ctx.lineWidth = borderWidth;
    const resolvedStroke = valueOrDefault(borderColor, candleDefaults.borderColor);
    ctx.strokeStyle =
      typeof resolvedStroke === "string"
        ? resolvedStroke
        : (resolvedStroke?.unchanged ?? "#000000");

    // Draw high-low wicks (vertical lines)
    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, Math.min(open, close));
    ctx.moveTo(x, low);
    ctx.lineTo(x, Math.max(open, close));
    ctx.stroke();

    // Calculate rectangle bounds for pixel-perfect rendering
    // For borders, we need to account for the stroke being drawn centered on the path
    const halfWidth = me.width / 2;
    const rectX = x - halfWidth;
    const rectY = close;
    const rectWidth = me.width;
    const rectHeight = open - close;

    // Fill the candlestick body
    ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

    // Draw border using a path for precise control
    // This ensures the border doesn't extend outside the intended dimensions
    if (borderWidth > 0) {
      const halfBorder = borderWidth / 2;
      ctx.beginPath();
      // Draw border path inside the rectangle bounds to avoid expansion
      ctx.rect(
        rectX + halfBorder,
        rectY + halfBorder,
        rectWidth - borderWidth,
        rectHeight - borderWidth
      );
      ctx.stroke();
    }
  }
}
