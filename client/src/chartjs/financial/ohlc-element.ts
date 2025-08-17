/**
 * OHLC Element
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

/**
 * OHLC chart element for drawing individual OHLC bars
 */
export class OhlcElement extends FinancialElement {
  static id = "ohlc";

  declare color?: ColorConfig;
  declare lineWidth?: number;
  declare armLength?: number | null;
  declare armLengthRatio?: number;

  static defaults = merge({}, [
    (Chart.defaults.elements as any).financial || {},
    {
      lineWidth: 2,
      armLength: null,
      armLengthRatio: 0.8
    }
  ]);

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;
    const { x, open, high, low, close } = me;
    const globalOpts = Chart.defaults;
    const elements = globalOpts.elements as any;

    const armLengthRatio = valueOrDefault(
      me.armLengthRatio,
      elements.ohlc?.armLengthRatio || 0.8
    );
    let armLength = valueOrDefault(me.armLength, elements.ohlc?.armLength || null);
    
    if (armLength === null) {
      // The width of an ohlc is affected by barPercentage and categoryPercentage
      // This behavior is caused by extending controller.financial, which extends controller.bar
      // barPercentage and categoryPercentage are now set to 1.0 (see controller.ohlc)
      // and armLengthRatio is multipled by 0.5,
      // so that when armLengthRatio=1.0, the arms from neighbour ohcl touch,
      // and when armLengthRatio=0.0, ohcl are just vertical lines.
      armLength = me.width * armLengthRatio * 0.5;
    }

    if (close < open) {
      ctx.strokeStyle = valueOrDefault(
        me.color ? me.color.up : undefined,
        elements.ohlc?.color?.up || elements.financial?.color?.up || "#1B5E20"
      );
    } else if (close > open) {
      ctx.strokeStyle = valueOrDefault(
        me.color ? me.color.down : undefined,
        elements.ohlc?.color?.down || elements.financial?.color?.down || "#B71C1C"
      );
    } else {
      ctx.strokeStyle = valueOrDefault(
        me.color ? me.color.unchanged : undefined,
        elements.ohlc?.color?.unchanged || elements.financial?.color?.unchanged || "#616161"
      );
    }
    
    ctx.lineWidth = valueOrDefault(me.lineWidth, elements.ohlc?.lineWidth || 2);

    ctx.beginPath();
    ctx.moveTo(x, high);
    ctx.lineTo(x, low);
    ctx.moveTo(x - armLength, open);
    ctx.lineTo(x, open);
    ctx.moveTo(x + armLength, close);
    ctx.lineTo(x, close);
    ctx.stroke();
  }
}