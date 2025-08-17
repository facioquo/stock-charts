// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { Chart } from "chart.js";
import { merge, valueOrDefault } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorConfig } from "./types";

const globalOpts = Chart.defaults;

/**
 * OHLC chart element
 */
export class OhlcElement extends FinancialElement {
  static readonly id = "ohlc";

  declare color: FinancialColorConfig;
  declare lineWidth: number;
  declare armLength: number | null;
  declare armLengthRatio: number;

  draw(ctx: CanvasRenderingContext2D): void {
    const { x, open, high, low, close } = this;

    const armLengthRatio = valueOrDefault(this.armLengthRatio, (globalOpts.elements as any).ohlc.armLengthRatio);
    let armLength = valueOrDefault(this.armLength, (globalOpts.elements as any).ohlc.armLength);
    if (armLength === null) {
      // The width of an ohlc is affected by barPercentage and categoryPercentage
      // This behavior is caused by extending controller.financial, which extends controller.bar
      // barPercentage and categoryPercentage are now set to 1.0 (see controller.ohlc)
      // and armLengthRatio is multipled by 0.5,
      // so that when armLengthRatio=1.0, the arms from neighbour ohcl touch,
      // and when armLengthRatio=0.0, ohcl are just vertical lines.
      armLength = this.width * armLengthRatio * 0.5;
    }

    if (close < open) {
      ctx.strokeStyle = valueOrDefault(
        this.color ? this.color.up : undefined, 
        (globalOpts.elements as any).ohlc.color.up
      );
    } else if (close > open) {
      ctx.strokeStyle = valueOrDefault(
        this.color ? this.color.down : undefined, 
        (globalOpts.elements as any).ohlc.color.down
      );
    } else {
      ctx.strokeStyle = valueOrDefault(
        this.color ? this.color.unchanged : undefined, 
        (globalOpts.elements as any).ohlc.color.unchanged
      );
    }
    ctx.lineWidth = valueOrDefault(this.lineWidth, (globalOpts.elements as any).ohlc.lineWidth);

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.moveTo(x - armLength, open);
    ctx.lineTo(x, open);
    ctx.moveTo(x + armLength, close);
    ctx.lineTo(x, close);
    ctx.stroke();
  }

  static readonly defaults = merge({}, [(globalOpts.elements as any).financial, {
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8
  }]);
}