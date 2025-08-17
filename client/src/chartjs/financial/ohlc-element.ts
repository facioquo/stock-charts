// OHLC (Open-High-Low-Close) chart element
// Based on chartjs-chart-financial
// https://github.com/chartjs/chartjs-chart-financial

import { Chart, ChartComponent } from "chart.js";
import { valueOrDefault, merge } from "chart.js/helpers";
import { FinancialElement } from "./financial-element";
import { FinancialColorOptions } from "./types";

interface OhlcElementProps {
  x: number;
  open: number;
  high: number;
  low: number;
  close: number;
  width: number;
  lineWidth?: number;
  armLength?: number | null;
  armLengthRatio?: number;
  color?: FinancialColorOptions;
}

export class OhlcElement extends FinancialElement {
  static readonly id = "ohlc";
  static readonly defaults: any;

  declare lineWidth?: number;
  declare armLength?: number | null;
  declare armLengthRatio?: number;
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

    const armLengthRatio = valueOrDefault(me.armLengthRatio, 0.8);
    let armLength = valueOrDefault(me.armLength, null);
    
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
        me.color?.up,
        defaultColors.up
      );
    } else if (close > open) {
      ctx.strokeStyle = valueOrDefault(
        me.color?.down,
        defaultColors.down
      );
    } else {
      ctx.strokeStyle = valueOrDefault(
        me.color?.unchanged,
        defaultColors.unchanged
      );
    }
    
    ctx.lineWidth = valueOrDefault(me.lineWidth, 2);

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

// Initialize defaults as a static property
(OhlcElement as any).defaults = {
  lineWidth: 2,
  armLength: null,
  armLengthRatio: 0.8
};

// Export component interface for registration
export const OhlcElementComponent: ChartComponent = OhlcElement as any;