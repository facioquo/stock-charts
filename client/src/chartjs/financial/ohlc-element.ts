// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial
// OhlcElement - visual element for OHLC bars

import { valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import type { FinancialColorConfig } from "./types";

/**
 * Default configuration for OHLC elements
 */
const OHLC_DEFAULTS = {
  lineWidth: 2,
  armLength: null as number | null,
  armLengthRatio: 0.8,
  borderColors: {
    up: "rgb(75, 192, 192)",
    down: "rgb(255, 99, 132)",
    unchanged: "rgb(201, 203, 207)"
  } as FinancialColorConfig
};

/**
 * OHLC Element - renders individual OHLC bars
 * Extends FinancialElement with OHLC-specific drawing logic
 */
export class OhlcElement extends FinancialElement {
  static readonly id = "ohlc" as const;

  static defaults = OHLC_DEFAULTS;

  /**
   * Draw the OHLC bar element
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const { x, open, high, low, close } = this;

    // Get styling properties with fallbacks
    const defaults = OHLC_DEFAULTS;
    const armLengthRatio = valueOrDefault(
      (this as FinancialElement & { armLengthRatio?: number }).armLengthRatio ??
        this.options?.armLengthRatio,
      defaults.armLengthRatio
    );

    let armLength = valueOrDefault(
      (this as FinancialElement & { armLength?: number }).armLength ?? this.options?.armLength,
      defaults.armLength
    );

    // Calculate arm length automatically if not specified
    // The width of an OHLC is affected by barPercentage and categoryPercentage
    // This behavior is caused by extending controller.financial, which extends controller.bar
    // barPercentage and categoryPercentage are now set to 1.0 (see controller.ohlc)
    // and armLengthRatio is multiplied by 0.5,
    // so that when armLengthRatio=1.0, the arms from neighbor OHLC touch,
    // and when armLengthRatio=0.0, OHLC are just vertical lines.
    armLength ??= (this.width ?? 0) * armLengthRatio * 0.5;

    // Determine stroke color based on price movement
    const borderColors = this.options?.borderColors ?? defaults.borderColors;
    let strokeColor: string;

    if (typeof borderColors === "string") {
      strokeColor = borderColors;
    } else if (close < open) {
      strokeColor = borderColors.down;
    } else if (close > open) {
      strokeColor = borderColors.up;
    } else {
      strokeColor = borderColors.unchanged;
    }

    ctx.strokeStyle = strokeColor;

    // Set line width
    ctx.lineWidth = valueOrDefault(
      (this as FinancialElement & { lineWidth?: number }).lineWidth ?? this.options?.lineWidth,
      defaults.lineWidth
    );

    // Draw the OHLC bar
    ctx.beginPath();

    // Vertical line (high to low)
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);

    // Left arm (open price)
    ctx.moveTo(x - armLength, open);
    ctx.lineTo(x, open);

    // Right arm (close price)
    ctx.moveTo(x + armLength, close);
    ctx.lineTo(x, close);

    ctx.stroke();
  }
}
