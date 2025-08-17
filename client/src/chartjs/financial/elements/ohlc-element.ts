/*!
 * chartjs-chart-financial v0.2.1
 * https://github.com/chartjs/chartjs-chart-financial
 * (c) 2017 Ben McCann
 * MIT License
 */

import { Chart } from 'chart.js';
import { merge, valueOrDefault } from 'chart.js/helpers';
import { FinancialElement } from './financial-element';

interface ColorConfig {
  up?: string;
  down?: string;
  unchanged?: string;
}

export interface OhlcElementProps {
  x: number;
  y: number;
  base: number;
  width: number;
  open: number;
  high: number;
  low: number;
  close: number;
  color?: ColorConfig;
  lineWidth?: number;
  armLength?: number | null;
  armLengthRatio?: number;
}

export class OhlcElement extends FinancialElement {
  static id = 'ohlc';
  static defaults = {
    lineWidth: 2,
    armLength: null,
    armLengthRatio: 0.8
  };

  declare color?: ColorConfig;
  declare lineWidth?: number;
  declare armLength?: number | null;
  declare armLengthRatio?: number;

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;

    const { x, open, high, low, close } = me;

    const financialDefaults = {
      color: {
        up: 'rgba(80, 160, 115, 1)',
        down: 'rgba(215, 85, 65, 1)',
        unchanged: 'rgba(90, 90, 90, 1)'
      },
      lineWidth: 2,
      armLength: null,
      armLengthRatio: 0.8
    };

    const armLengthRatio = valueOrDefault(
      me.armLengthRatio,
      financialDefaults.armLengthRatio
    );
    let armLength = valueOrDefault(
      me.armLength,
      financialDefaults.armLength
    );
    
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
        financialDefaults.color.up
      );
    } else if (close > open) {
      ctx.strokeStyle = valueOrDefault(
        me.color?.down,
        financialDefaults.color.down
      );
    } else {
      ctx.strokeStyle = valueOrDefault(
        me.color?.unchanged,
        financialDefaults.color.unchanged
      );
    }
    
    ctx.lineWidth = valueOrDefault(
      me.lineWidth,
      financialDefaults.lineWidth
    );

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