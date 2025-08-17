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

export interface CandlestickElementProps {
  x: number;
  y: number;
  base: number;
  width: number;
  open: number;
  high: number;
  low: number;
  close: number;
  color?: ColorConfig;
  borderColor?: string | ColorConfig;
  borderWidth?: number;
}

export class CandlestickElement extends FinancialElement {
  static id = 'candlestick';
  static defaults = {
    borderWidth: 1
  };

  declare color?: ColorConfig;
  declare borderColor?: string | ColorConfig;
  declare borderWidth?: number;

  draw(ctx: CanvasRenderingContext2D): void {
    const me = this;

    const { x, open, high, low, close } = me;

    let borderColors = me.borderColor;
    if (typeof borderColors === 'string') {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    const defaults = (Chart.defaults as any);
    const financialDefaults = {
      color: {
        up: 'rgba(80, 160, 115, 1)',
        down: 'rgba(215, 85, 65, 1)',
        unchanged: 'rgba(90, 90, 90, 1)'
      },
      borderColor: 'rgba(90, 90, 90, 1)',
      borderWidth: 1
    };

    let borderColor: string;
    if (close < open) {
      borderColor = valueOrDefault(
        borderColors?.up,
        financialDefaults.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.up,
        financialDefaults.color.up
      );
    } else if (close > open) {
      borderColor = valueOrDefault(
        borderColors?.down,
        financialDefaults.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.down,
        financialDefaults.color.down
      );
    } else {
      borderColor = valueOrDefault(
        borderColors?.unchanged,
        financialDefaults.borderColor
      );
      ctx.fillStyle = valueOrDefault(
        me.color?.unchanged,
        financialDefaults.color.unchanged
      );
    }

    ctx.lineWidth = valueOrDefault(
      me.borderWidth,
      financialDefaults.borderWidth
    );
    ctx.strokeStyle = valueOrDefault(
      borderColor,
      financialDefaults.borderColor
    );

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