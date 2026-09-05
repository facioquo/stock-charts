import { describe, expect, it } from "vitest";

import type { ScatterDataPoint } from "chart.js";

import { PRICE_DATASET_ORDER } from "@facioquo/chartjs-chart-financial";

import { baseDataset, createThresholdDataset } from "./datasets";
import type {
  ChartThreshold,
  IndicatorDataset,
  IndicatorResult,
  IndicatorResultConfig
} from "./types";

// `IndicatorDataset` is a union over the three chart types; `borderDash` belongs
// to the line member alone.
function asLine(ds: IndicatorDataset) {
  if (ds.type !== "line") {
    throw new Error(`expected a line dataset, got ${ds.type}`);
  }
  return ds;
}

function makeResult(overrides?: Partial<IndicatorResult>): IndicatorResult {
  return {
    label: "RSI",
    displayName: "RSI",
    dataName: "rsi",
    color: "#FFA726",
    lineType: "solid",
    lineWidth: 2,
    order: 0,
    dataset: { type: "line", data: [], label: "RSI" },
    ...overrides
  };
}

function makeResultConfig(overrides?: Partial<IndicatorResultConfig>): IndicatorResultConfig {
  return {
    displayName: "RSI",
    tooltipTemplate: "RSI: $VALUE",
    dataName: "rsi",
    dataType: "number",
    lineType: "solid",
    stack: "",
    lineWidth: 2,
    defaultColor: "#FFA726",
    order: 0,
    ...overrides
  };
}

describe("baseDataset", () => {
  it("returns a typed line dataset for lineType=solid", () => {
    const ds = baseDataset(makeResult({ lineType: "solid" }), makeResultConfig());
    expect(ds.type).toBe("line");
    expect(ds.data).toEqual([]);
  });

  it("returns a bar dataset for lineType=bar and applies stack when configured", () => {
    const ds = baseDataset(
      makeResult({ lineType: "bar" }),
      makeResultConfig({ lineType: "bar", stack: "macd-hist" })
    );
    expect(ds.type).toBe("bar");
    expect(ds.stack).toBe("macd-hist");
  });

  it("returns a candlestick dataset for lineType=candle without per-result color", () => {
    const ds = baseDataset(
      makeResult({ lineType: "candle", dataName: "close" }),
      makeResultConfig({ lineType: "candle", dataName: "close" })
    );
    expect(ds.type).toBe("candlestick");
    expect(ds.data).toEqual([]);
    // up/down coloring comes from the themed candlestick element defaults;
    // a static per-result color would override the up/down split.
    expect(ds.borderColor).toBeUndefined();
    expect(ds.backgroundColor).toBeUndefined();
  });

  it("puts a candle overlay on the price layer, ignoring the listing order", () => {
    // The series replaces the price candles, so it has to occupy their layer:
    // anything drawn over or under the price series must land the same way
    // over or under the replacement. The listing's own order (1 for
    // Heikin-Ashi) would otherwise float it above every other overlay.
    const ds = baseDataset(
      makeResult({ lineType: "candle", dataName: "close", order: 1 }),
      makeResultConfig({ lineType: "candle", dataName: "close" })
    );
    expect(ds.order).toBe(PRICE_DATASET_ORDER);
    expect(ds.order).not.toBe(1);
  });

  it("throws on an unsupported lineType", () => {
    expect(() =>
      baseDataset(makeResult({ lineType: "spline" }), makeResultConfig({ lineType: "spline" }))
    ).toThrow(/Unsupported lineType: "spline"/);
  });
});

describe("createThresholdDataset", () => {
  it("emits one point per source point with y = threshold.value", () => {
    const sourceData: ScatterDataPoint[] = [
      { x: 1000, y: 30 },
      { x: 2000, y: 70 },
      { x: 3000, y: 50 }
    ];
    const first = makeResult();
    first.dataset.data = sourceData;

    const threshold: ChartThreshold = {
      value: 80,
      color: "#FF0000",
      style: "dash",
      fill: null
    };

    const ds = createThresholdDataset(threshold, first, 0);

    expect(ds.type).toBe("line");
    expect(ds.data).toEqual([
      { x: 1000, y: 80 },
      { x: 2000, y: 80 },
      { x: 3000, y: 80 }
    ]);
    expect(ds.borderColor).toBe("#FF0000");
    expect(asLine(ds).borderDash).toEqual([5, 2]);
  });

  it("returns an empty data array when the source dataset is empty", () => {
    const first = makeResult();
    first.dataset.data = [];

    const ds = createThresholdDataset(
      { value: 0, color: "#000", style: "solid", fill: null },
      first,
      0
    );

    expect(ds.data).toEqual([]);
    expect(asLine(ds).borderDash).toEqual([]);
  });

  it("offsets the order by index so multiple thresholds stack predictably", () => {
    const first = makeResult();
    first.dataset.data = [{ x: 1, y: 50 }];

    const a = createThresholdDataset(
      { value: 30, color: "#0F0", style: "dash", fill: null },
      first,
      0
    );
    const b = createThresholdDataset(
      { value: 70, color: "#F00", style: "dash", fill: null },
      first,
      1
    );

    expect((b.order ?? 0) - (a.order ?? 0)).toBe(1);
  });
});
