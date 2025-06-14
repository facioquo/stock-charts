// chartjs-chart-financial
// based on https://github.com/chartjs/chartjs-chart-financial

import { Chart, Element, defaults, BarController } from "chart.js";
import { merge, valueOrDefault, isNullOrUndef, clipArea, unclipArea } from "chart.js/helpers";

const globalOpts$2 = Chart.defaults;

globalOpts$2.elements.financial = {
  color: {
    up: "rgba(80, 160, 115, 1)",
    down: "rgba(215, 85, 65, 1)",
    unchanged: "rgba(90, 90, 90, 1)"
  }
};

/**
 * Helper function to get the bounds of the bar regardless of the orientation
 * @param {Rectangle} bar the bar
 * @param {boolean} [useFinalPosition]
 * @return {object} bounds of the bar
 * @private
 */
function getBarBounds(bar, useFinalPosition) {
  const { x, y, base, width, height } = bar.getProps(["x", "low", "high", "width", "height"], useFinalPosition);

  let left, right, top, bottom, half;

  if (bar.horizontal) {
    half = height / 2;
    left = Math.min(x, base);
    right = Math.max(x, base);
    top = y - half;
    bottom = y + half;
  } else {
    half = width / 2;
    left = x - half;
    right = x + half;
    top = Math.min(y, base); // use min because 0 pixel at top of screen
    bottom = Math.max(y, base);
  }

  return { left, top, right, bottom };
}

function inRange(bar, x, y, useFinalPosition) {
  const skipX = x === null;
  const skipY = y === null;
  const bounds = !bar || (skipX && skipY) ? false : getBarBounds(bar, useFinalPosition);

  return bounds
    && (skipX || x >= bounds.left && x <= bounds.right)
    && (skipY || y >= bounds.top && y <= bounds.bottom);
}

class FinancialElement extends Element {

  height() {
    return this.base - this.y;
  }

  inRange(mouseX, mouseY, useFinalPosition) {
    return inRange(this, mouseX, mouseY, useFinalPosition);
  }

  inXRange(mouseX, useFinalPosition) {
    return inRange(this, mouseX, null, useFinalPosition);
  }

  inYRange(mouseY, useFinalPosition) {
    return inRange(this, null, mouseY, useFinalPosition);
  }

  getRange(axis) {
    return axis === "x" ? this.width / 2 : this.height / 2;
  }

  getCenterPoint(useFinalPosition) {
    const { x, low, high } = this.getProps(["x", "low", "high"], useFinalPosition);
    return {
      x,
      y: (high + low) / 2
    };
  }

  tooltipPosition(useFinalPosition) {
    const { x, open, close } = this.getProps(["x", "open", "close"], useFinalPosition);
    return {
      x,
      y: (open + close) / 2
    };
  }
}

const globalOpts$1 = Chart.defaults;

class OhlcElement extends FinancialElement {
  draw(ctx) {
    const me = this;

    const { x, open, high, low, close } = me;

    const armLengthRatio = valueOrDefault(me.armLengthRatio, globalOpts$1.elements.ohlc.armLengthRatio);
    let armLength = valueOrDefault(me.armLength, globalOpts$1.elements.ohlc.armLength);
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
      ctx.strokeStyle = valueOrDefault(me.color ? me.color.up : undefined, globalOpts$1.elements.ohlc.color.up);
    } else if (close > open) {
      ctx.strokeStyle = valueOrDefault(me.color ? me.color.down : undefined, globalOpts$1.elements.ohlc.color.down);
    } else {
      ctx.strokeStyle = valueOrDefault(me.color ? me.color.unchanged : undefined, globalOpts$1.elements.ohlc.color.unchanged);
    }
    ctx.lineWidth = valueOrDefault(me.lineWidth, globalOpts$1.elements.ohlc.lineWidth);

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

OhlcElement.id = "ohlc";
OhlcElement.defaults = merge({}, [globalOpts$1.elements.financial, {
  lineWidth: 2,
  armLength: null,
  armLengthRatio: 0.8
}]);

/**
 * Computes the "optimal" sample size to maintain bars equally sized while preventing overlap.
 * @private
 */
function computeMinSampleSize(scale, pixels) {
  let min = scale._length;
  let prev, curr, i, ilen;

  for (i = 1, ilen = pixels.length; i < ilen; ++i) {
    min = Math.min(min, Math.abs(pixels[i] - pixels[i - 1]));
  }

  for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
    curr = scale.getPixelForTick(i);
    min = i > 0 ? Math.min(min, Math.abs(curr - prev)) : min;
    prev = curr;
  }

  return min;
}

/**
 * This class is based off controller.bar.js from the upstream Chart.js library
 */
class FinancialController extends BarController {

  getLabelAndValue(index) {
    const me = this;
    const parsed = me.getParsed(index);
    const axis = me._cachedMeta.iScale.axis;

    const { o, h, l, c } = parsed;
    const value = `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;

    return {
      label: `${me._cachedMeta.iScale.getLabelForValue(parsed[axis])}`,
      value
    };
  }

  getAllParsedValues() {
    const meta = this._cachedMeta;
    const axis = meta.iScale.axis;
    const parsed = meta._parsed;
    const values = [];
    for (let i = 0; i < parsed.length; ++i) {
      values.push(parsed[i][axis]);
    }
    return values;
  }

  /**
   * Implement this ourselves since it doesn't handle high and low values
   * https://github.com/chartjs/Chart.js/issues/7328
   * @protected
   */
  getMinMax(scale) {
    const meta = this._cachedMeta;
    const _parsed = meta._parsed;
    const axis = meta.iScale.axis;

    if (_parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === meta.iScale) {
      return { min: _parsed[0][axis], max: _parsed[_parsed.length - 1][axis] };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < _parsed.length; i++) {
      const data = _parsed[i];
      min = Math.min(min, data.l);
      max = Math.max(max, data.h);
    }
    return { min, max };
  }

  _getRuler() {
    const me = this;
    const opts = me.options;
    const meta = me._cachedMeta;
    const iScale = meta.iScale;
    const axis = iScale.axis;
    const pixels = [];
    for (let i = 0; i < meta.data.length; ++i) {
      pixels.push(iScale.getPixelForValue(me.getParsed(i)[axis]));
    }
    const barThickness = opts.barThickness;
    const min = computeMinSampleSize(iScale, pixels);
    return {
      min,
      pixels,
      start: iScale._startPixel,
      end: iScale._endPixel,
      stackCount: me._getStackCount(),
      scale: iScale,
      ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
    };
  }

  /**
   * @protected
   */
  calculateElementProperties(index, ruler, reset, options) {
    const me = this;
    const vscale = me._cachedMeta.vScale;
    const base = vscale.getBasePixel();
    const ipixels = me._calculateBarIndexPixels(index, ruler, options);
    const data = me.chart.data.datasets[me.index].data[index];
    const open = vscale.getPixelForValue(data.o);
    const high = vscale.getPixelForValue(data.h);
    const low = vscale.getPixelForValue(data.l);
    const close = vscale.getPixelForValue(data.c);

    return {
      base: reset ? base : low,
      x: ipixels.center,
      y: (low + high) / 2,
      width: ipixels.size,
      open,
      high,
      low,
      close
    };
  }

  draw() {
    const me = this;
    const chart = me.chart;
    const rects = me._cachedMeta.data;
    clipArea(chart.ctx, chart.chartArea);
    for (let i = 0; i < rects.length; ++i) {
      rects[i].draw(me._ctx);
    }
    unclipArea(chart.ctx);
  }

}

FinancialController.overrides = {
  label: "",

  parsing: false,

  hover: {
    mode: "label"
  },

  datasets: {
    categoryPercentage: 0.8,
    barPercentage: 0.9,
    animation: {
      numbers: {
        type: "number",
        properties: ["x", "y", "base", "width", "open", "high", "low", "close"]
      }
    }
  },

  plugins: {
    tooltip: {
      intersect: false,
      mode: "index",
      callbacks: {
        label(ctx) {
          const point = ctx.parsed;

          if (!isNullOrUndef(point.y)) {
            return defaults.plugins.tooltip.callbacks.label(ctx);
          }

          const { o, h, l, c } = point;

          return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
        }
      }
    }
  }
};

class OhlcController extends FinancialController {

  updateElements(elements, start, count, mode) {
    const me = this;
    const dataset = me.getDataset();
    const ruler = me._ruler || me._getRuler();
    const firstOpts = me.resolveDataElementOptions(start, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);

    for (let i = 0; i < count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        lineWidth: dataset.lineWidth,
        armLength: dataset.armLength,
        armLengthRatio: dataset.armLengthRatio,
        color: dataset.color
      };

      if (includeOptions) {
        properties.options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }

}

OhlcController.id = "ohlc";
OhlcController.defaults = merge({
  dataElementType: OhlcElement.id,
  datasets: {
    barPercentage: 1.0,
    categoryPercentage: 1.0
  }
}, Chart.defaults.financial);

const globalOpts = Chart.defaults;

class CandlestickElement extends FinancialElement {
  draw(ctx) {
    const me = this;

    const { x, open, high, low, close } = me;

    let borderColors = me.borderColor;
    if (typeof borderColors === "string") {
      borderColors = {
        up: borderColors,
        down: borderColors,
        unchanged: borderColors
      };
    }

    let borderColor;
    if (close < open) {
      borderColor = valueOrDefault(borderColors ? borderColors.up : undefined, globalOpts.elements.candlestick.borderColor);
      ctx.fillStyle = valueOrDefault(me.color ? me.color.up : undefined, globalOpts.elements.candlestick.color.up);
    } else if (close > open) {
      borderColor = valueOrDefault(borderColors ? borderColors.down : undefined, globalOpts.elements.candlestick.borderColor);
      ctx.fillStyle = valueOrDefault(me.color ? me.color.down : undefined, globalOpts.elements.candlestick.color.down);
    } else {
      borderColor = valueOrDefault(borderColors ? borderColors.unchanged : undefined, globalOpts.elements.candlestick.borderColor);
      ctx.fillStyle = valueOrDefault(me.color ? me.color.unchanged : undefined, globalOpts.elements.candlestick.color.unchanged);
    }

    ctx.lineWidth = valueOrDefault(me.borderWidth, globalOpts.elements.candlestick.borderWidth);
    ctx.strokeStyle = valueOrDefault(borderColor, globalOpts.elements.candlestick.borderColor);

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

CandlestickElement.id = "candlestick";
CandlestickElement.defaults = merge({}, [globalOpts.elements.financial, {
  borderColor: globalOpts.elements.financial.color.unchanged,
  borderWidth: 1
}]);

class CandlestickController extends FinancialController {

  updateElements(elements, start, count, mode) {
    const me = this;
    const dataset = me.getDataset();
    const ruler = me._ruler || me._getRuler();
    const firstOpts = me.resolveDataElementOptions(start, mode);
    const sharedOptions = me.getSharedOptions(firstOpts);
    const includeOptions = me.includeOptions(mode, sharedOptions);

    me.updateSharedOptions(sharedOptions, mode, firstOpts);

    for (let i = start; i < count; i++) {
      const options = sharedOptions || me.resolveDataElementOptions(i, mode);

      const baseProperties = me.calculateElementProperties(i, ruler, mode === "reset", options);
      const properties = {
        ...baseProperties,
        datasetLabel: dataset.label || "",
        // label: '', // to get label value please use dataset.data[index].label

        // Appearance
        color: dataset.color,
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth
      };

      if (includeOptions) {
        properties.options = options;
      }
      me.updateElement(elements[i], i, properties, mode);
    }
  }

}

CandlestickController.id = "candlestick";
CandlestickController.defaults = merge({
  dataElementType: CandlestickElement.id
}, Chart.defaults.financial);

export { CandlestickController, CandlestickElement, OhlcController, OhlcElement };
