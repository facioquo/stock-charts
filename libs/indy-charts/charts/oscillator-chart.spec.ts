import { describe, expect, it, vi } from "vitest";

import { OscillatorChart } from "./oscillator-chart";
import {
  type ChartSettings,
  type IndicatorDataset,
  type IndicatorSelection
} from "../config/types";

const settings: ChartSettings = { isDarkTheme: true, showTooltips: false };

const ramp = (n: number): number[] => Array.from({ length: n }, (_, i) => i);
const colors = (n: number): string[] => ramp(n).map(i => `c${i.toString()}`);

describe("OscillatorChart.applySlicedData", () => {
  it("cuts the data and every per-point style array to the same window", () => {
    const chart = new OscillatorChart({} as CanvasRenderingContext2D, settings);
    const full = {
      type: "line",
      data: ramp(10).map(i => ({ x: i, y: i })),
      pointRotation: ramp(10),
      pointBackgroundColor: colors(10),
      pointBorderColor: colors(10),
      backgroundColor: colors(10)
    } as unknown as IndicatorDataset;
    const dataset = {
      type: "line",
      data: []
    } as unknown as IndicatorSelection["results"][number]["dataset"];
    const selection = {
      ucid: "u1",
      label: "X",
      results: [{ dataset }]
    } as unknown as IndicatorSelection;

    const threshold = {
      data: ramp(10).map(i => ({ x: i, y: 70 })),
      backgroundColor: colors(10)
    };
    const thresholdTarget = { data: [] as unknown[], backgroundColor: [] as string[] };
    const update = vi.fn();
    const internals = chart as unknown as Record<string, unknown>;
    internals["fullThresholdDatasets"] = [threshold];
    internals["_chart"] = {
      data: { datasets: [thresholdTarget] },
      options: { plugins: { annotation: { annotations: {} } } },
      scales: {},
      update
    };

    chart.applySlicedData(selection, [full], 2, 5);

    const sliced = dataset as unknown as Record<string, unknown[]>;
    expect(sliced["data"]).toEqual(full.data.slice(2, 5));
    expect(sliced["pointRotation"]).toEqual([2, 3, 4]);
    expect(sliced["pointBackgroundColor"]).toEqual(["c2", "c3", "c4"]);
    expect(sliced["pointBorderColor"]).toEqual(["c2", "c3", "c4"]);
    expect(sliced["backgroundColor"]).toEqual(["c2", "c3", "c4"]);
    expect(thresholdTarget.data).toHaveLength(3);
    expect(thresholdTarget.backgroundColor).toEqual(["c2", "c3", "c4"]);
  });
});
