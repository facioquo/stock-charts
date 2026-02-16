/*
 * Derived from chartjs-chart-financial (https://github.com/chartjs/chartjs-chart-financial)
 * Version reference: upstream plugin v0.2.x API surface.
 * License: MIT.
 */

import { BarController, defaults } from "chart.js";
import { clipArea, isNullOrUndef, unclipArea } from "chart.js/helpers";

import { computeMinSampleSize } from "../helpers/sample-size";
import { FinancialDataPoint } from "../types/financial.types";

interface ParsedFinancialLike {
  x: number;
  o: number;
  h: number;
  l: number;
  c: number;
  y?: number | null;
}

interface ControllerMetaLike {
  iScale: {
    axis: "x" | "y";
    _startPixel: number;
    _endPixel: number;
    ticks: unknown[];
    _length: number;
    getPixelForTick: (index: number) => number;
    getPixelForValue: (value: number) => number;
    getLabelForValue: (value: number) => string;
  };
  vScale: {
    getBasePixel: () => number;
    getPixelForValue: (value: number) => number;
  };
  _parsed: ParsedFinancialLike[];
  data: Array<{ draw: (ctx: CanvasRenderingContext2D) => void }>;
}

interface FinancialControllerInternals {
  _cachedMeta: ControllerMetaLike;
  options: {
    barThickness?: number;
    categoryPercentage: number;
    barPercentage: number;
  };
  _ctx: CanvasRenderingContext2D;
  _ruler?: unknown;
  _getStackCount: () => number;
  _calculateBarIndexPixels: (
    index: number,
    ruler: Ruler,
    options: unknown
  ) => { center: number; size: number };
  chart: {
    ctx: CanvasRenderingContext2D;
    data: {
      datasets: Array<{
        data: FinancialDataPoint[];
      }>;
    };
    chartArea: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
  };
  index: number;
}

interface Ruler {
  min: number;
  pixels: number[];
  start: number;
  end: number;
  stackCount: number;
  scale: ControllerMetaLike["iScale"];
  ratio: number;
}

export class FinancialController extends BarController {
  static overrides = {
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
          label(ctx: { parsed: ParsedFinancialLike }): string {
            const point = ctx.parsed;
            if (!isNullOrUndef(point.y)) {
              return "";
            }

            const { o, h, l, c } = point;
            return `O: ${o}  H: ${h}  L: ${l}  C: ${c}`;
          }
        }
      }
    }
  };

  getLabelAndValue(index: number): { label: string; value: string } {
    const controller = this as unknown as FinancialControllerInternals;
    const parsed = this.getParsed(index) as ParsedFinancialLike;
    const axis = controller._cachedMeta.iScale.axis;
    const { o, h, l, c } = parsed;

    return {
      label: `${controller._cachedMeta.iScale.getLabelForValue(parsed[axis] ?? 0)}`,
      value: `O: ${o}  H: ${h}  L: ${l}  C: ${c}`
    };
  }

  getAllParsedValues(): number[] {
    const controller = this as unknown as FinancialControllerInternals;
    const axis = controller._cachedMeta.iScale.axis;
    return controller._cachedMeta._parsed.map(point => point[axis] ?? 0);
  }

  getMinMax(scale: object): { min: number; max: number } {
    const controller = this as unknown as FinancialControllerInternals;
    const parsed = controller._cachedMeta._parsed;
    const axis = controller._cachedMeta.iScale.axis;

    if (parsed.length < 2) {
      return { min: 0, max: 1 };
    }

    if (scale === controller._cachedMeta.iScale) {
      return { min: parsed[0][axis] ?? 0, max: parsed[parsed.length - 1][axis] ?? 0 };
    }

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const point of parsed) {
      min = Math.min(min, point.l);
      max = Math.max(max, point.h);
    }

    return { min, max };
  }

  _getRuler(): Ruler {
    const controller = this as unknown as FinancialControllerInternals;
    const iScale = controller._cachedMeta.iScale;
    const axis = iScale.axis;
    const pixels: number[] = [];

    for (let i = 0; i < controller._cachedMeta.data.length; ++i) {
      const parsed = this.getParsed(i) as ParsedFinancialLike;
      pixels.push(iScale.getPixelForValue(parsed[axis] ?? 0));
    }

    const barThickness = controller.options.barThickness;
    const min = computeMinSampleSize(iScale, pixels);

    return {
      min,
      pixels,
      start: iScale._startPixel,
      end: iScale._endPixel,
      stackCount: controller._getStackCount(),
      scale: iScale,
      ratio: barThickness
        ? 1
        : controller.options.categoryPercentage * controller.options.barPercentage
    };
  }

  calculateElementProperties(
    index: number,
    ruler: Ruler,
    reset: boolean,
    options: unknown
  ): {
    base: number;
    x: number;
    y: number;
    width: number;
    open: number;
    high: number;
    low: number;
    close: number;
    direction: "up" | "down" | "unchanged";
  } {
    const controller = this as unknown as FinancialControllerInternals;
    const vScale = controller._cachedMeta.vScale;
    const base = vScale.getBasePixel();
    const iPixels = controller._calculateBarIndexPixels(index, ruler, options);

    // Defensive check for data access
    const data = controller.chart?.data?.datasets?.[controller.index]?.data?.[index];
    if (
      !data ||
      typeof data.o !== "number" ||
      typeof data.h !== "number" ||
      typeof data.l !== "number" ||
      typeof data.c !== "number"
    ) {
      // Return safe defaults if data is missing or invalid
      return {
        base,
        x: iPixels.center,
        y: base,
        width: iPixels.size,
        open: base,
        high: base,
        low: base,
        close: base,
        direction: "unchanged" as const
      };
    }

    const open = vScale.getPixelForValue(data.o);
    const high = vScale.getPixelForValue(data.h);
    const low = vScale.getPixelForValue(data.l);
    const close = vScale.getPixelForValue(data.c);

    const direction = data.c > data.o ? "up" : data.c < data.o ? "down" : "unchanged";

    return {
      base: reset ? base : low,
      x: iPixels.center,
      y: (low + high) / 2,
      width: iPixels.size,
      open,
      high,
      low,
      close,
      direction
    };
  }

  draw(): void {
    const controller = this as unknown as FinancialControllerInternals;
    const chart = controller.chart;
    const rects = controller._cachedMeta.data;

    clipArea(chart.ctx, chart.chartArea);
    for (const rect of rects) {
      rect.draw(chart.ctx);
    }
    unclipArea(chart.ctx);
  }
}

const currentDefaults = defaults as unknown as {
  financial?: {
    color: { up: string; down: string; unchanged: string };
  };
};

currentDefaults.financial ??= {
  color: {
    up: "rgba(80, 160, 115, 1)",
    down: "rgba(215, 85, 65, 1)",
    unchanged: "rgba(90, 90, 90, 1)"
  }
};
