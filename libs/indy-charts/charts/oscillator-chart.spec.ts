import { describe, expect, it, vi } from "vitest";

import {
  type Chart as ChartJs,
  type ChartConfiguration,
  type ChartData,
  type ChartOptions
} from "chart.js";

import { LEGEND_ENTRY_GAP, LEGEND_ROW_HEIGHT, LEGEND_SWATCH_WIDTH } from "../config/legend";
import { getThemeColors } from "../config/theme-colors";
import { OscillatorChart } from "./oscillator-chart";
import {
  type ChartSettings,
  type IndicatorDataset,
  type IndicatorListing,
  type IndicatorSelection
} from "../config/types";

vi.mock("chart.js", async importOriginal => {
  const actual = await importOriginal<{ Chart: typeof ChartJs }>();

  /** Canvas-free stand-in for render(). Like Chart.js, it fires `onResize` while it is constructed. */
  class Chart {
    // The financial controllers read the shared defaults when they load.
    static defaults = actual.Chart.defaults;

    width = 1000;
    chartArea = { left: 0, right: 1000 };
    scales = { x: { min: 0 }, y: { max: 100, ticks: [] } };
    options: ChartOptions;
    data: ChartData;

    constructor(_ctx: unknown, config: ChartConfiguration) {
      this.options = config.options ?? {};
      this.data = config.data;
      this.options.onResize?.(this as never, { width: 1000, height: 150 });
    }

    update(): void {}
    destroy(): void {}
  }

  return { ...actual, Chart };
});

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

describe("OscillatorChart.updateLegend", () => {
  type Written = Array<{
    id: string;
    content: string[];
    color: string;
    xAdjust: number;
    yAdjust: number;
  }>;

  function legendChart(
    chartSettings: ChartSettings,
    width = 1000,
    ticks: Array<{ label: string | null }> = []
  ) {
    const chart = new OscillatorChart({} as CanvasRenderingContext2D, chartSettings);
    const options = { plugins: { annotation: { annotations: {} as unknown } } };
    (chart as unknown as { _chart: unknown })._chart = {
      width,
      chartArea: { left: 0, right: width },
      scales: { x: { min: 0 }, y: { max: 100, ticks } },
      options,
      update: vi.fn()
    };
    return { chart, options };
  }

  const selection = (...results: Array<[label: string, lineType?: string]>) =>
    ({
      ucid: "u1",
      label: "MACD(12,26,9)",
      results: results.map(([label, lineType = "solid"], index) => ({
        label,
        lineType,
        color: `#00000${index.toString()}`
      }))
    }) as unknown as IndicatorSelection;

  const macd = selection(["MACD"], ["Signal"], ["Histogram", "bar"]);
  const seriesLegend = { ...settings, showSeriesLegend: true };
  const written = (options: { plugins: { annotation: { annotations: unknown } } }) =>
    options.plugins.annotation.annotations as Written;

  it("keeps the indicator label alone unless the series legend is on", () => {
    const { chart, options } = legendChart(settings);

    chart.updateLegend(macd);

    const annotations = options.plugins.annotation.annotations as Record<
      string,
      { content: string[] }
    >;
    expect(Object.keys(annotations)).toEqual(["annotation"]);
    expect(annotations["annotation"]?.content).toEqual(["MACD(12,26,9)"]);
  });

  it("keeps the indicator label alone on a single-line pane", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(selection(["RSI(14)"]));

    expect(Object.keys(options.plugins.annotation.annotations as object)).toEqual(["annotation"]);
  });

  it("names each line after the indicator label, in result order", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(macd);

    const labels = written(options).filter(a => !a.id.endsWith("-swatch"));
    expect(labels.map(a => a.content.join(""))).toEqual([
      "MACD(12,26,9)",
      "MACD",
      "Signal",
      "Histogram"
    ]);
    expect(labels.map(a => a.id)).toEqual(["legend", "legend1", "legend2", "legend3"]);
  });

  it("drops the indicator label when a line already carries it", () => {
    const { chart, options } = legendChart(seriesLegend);
    const adx = { ...selection(["ADX(14)"], ["DI+(14)"]), label: "ADX(14)" };

    chart.updateLegend(adx);

    const entries = written(options);
    expect(entries.filter(a => !a.id.endsWith("-swatch")).map(a => a.content.join(""))).toEqual([
      "ADX(14)",
      "DI+(14)"
    ]);
    expect(entries.find(a => a.id === "legend1-swatch")?.xAdjust).toBe(0);
  });

  it("colours each swatch by its line and each label by theme text", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(macd);

    const entries = written(options);
    expect(entries.filter(a => a.id.endsWith("-swatch")).map(a => a.color)).toEqual([
      "#000000",
      "#000001",
      "#000002"
    ]);
    expect(entries.find(a => a.id === "legend2")?.color).toBe(getThemeColors(settings).text);
  });

  it("starts the entries after the indicator label, each label after its swatch", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(macd);

    const entries = written(options);
    const swatch = entries.find(a => a.id === "legend1-swatch");
    const label = entries.find(a => a.id === "legend1");
    // Without a canvas to measure, a label is estimated at 7 px a character.
    expect(swatch?.xAdjust).toBe("MACD(12,26,9)".length * 7 + LEGEND_ENTRY_GAP);
    expect(label?.xAdjust).toBe((swatch?.xAdjust ?? 0) + LEGEND_SWATCH_WIDTH);
    expect(entries.map(a => a.yAdjust)).toEqual(Array(7).fill(1));
  });

  it("wraps entries that do not fit the pane onto rows below the label", () => {
    const { chart, options } = legendChart(seriesLegend, 200);

    chart.updateLegend(macd);

    const rows = written(options)
      .filter(a => a.id.startsWith("legend") && !a.id.endsWith("-swatch"))
      .map(a => (a.yAdjust - 1) / LEGEND_ROW_HEIGHT);
    expect(rows[0]).toBe(0);
    expect(rows.at(-1)).toBeGreaterThan(0);
    expect(written(options).find(a => a.id === "legend2-swatch")?.xAdjust).toBe(0);
  });

  it("wraps at the plot area, not the full canvas", () => {
    const { chart, options } = legendChart(seriesLegend);
    const stub = (chart as unknown as { _chart: { chartArea: { left: number; right: number } } })
      ._chart;
    stub.chartArea = { left: 0, right: 200 };

    chart.updateLegend(macd);

    expect(written(options).find(a => a.id === "legend2-swatch")?.xAdjust).toBe(0);
  });

  it("wraps before the right-hand axis labels unless they are hidden", () => {
    // The labels draw inside the plot (mirrored), so an entry running to the edge would cover them.
    const ticks = [{ label: "-10000K" }, { label: null }];
    const shown = legendChart(seriesLegend, 320, ticks);
    const hidden = legendChart({ ...seriesLegend, showRightAxisLabels: false }, 320, ticks);

    shown.chart.updateLegend(macd);
    hidden.chart.updateLegend(macd);

    const histogramRow = (options: typeof shown.options) =>
      ((written(options).find(a => a.id === "legend3")?.yAdjust ?? 0) - 1) / LEGEND_ROW_HEIGHT;
    expect(histogramRow(shown.options)).toBe(1);
    expect(histogramRow(hidden.options)).toBe(0);
  });

  it("leaves hidden `none` results out", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(selection(["Upper"], ["Lower"], ["Hidden", "none"]));

    const labels = written(options).filter(a => !a.id.endsWith("-swatch"));
    expect(labels.map(a => a.content.join(""))).toEqual(["MACD(12,26,9)", "Upper", "Lower"]);
  });

  it("keeps the indicator label alone when only one line is drawn beside a `none` result", () => {
    const { chart, options } = legendChart(seriesLegend);

    chart.updateLegend(selection(["Upper"], ["Hidden", "none"]));

    expect(Object.keys(options.plugins.annotation.annotations as object)).toEqual(["annotation"]);
  });

  it("re-wraps the series legend after a resize", async () => {
    const { chart, options } = legendChart(seriesLegend);
    chart.updateLegend(macd);
    expect(written(options).every(a => a.yAdjust === 1)).toBe(true);

    const stub = (
      chart as unknown as { _chart: { width: number; chartArea: { left: number; right: number } } }
    )._chart;
    stub.width = 200;
    stub.chartArea = { left: 0, right: 200 };
    (chart as unknown as { _onResize: () => void })._onResize();
    await Promise.resolve();

    expect(written(options).some(a => a.yAdjust > 1)).toBe(true);
  });

  it("keeps the legend of the selection a re-render shows", async () => {
    // A new Chart fires onResize inside render(), while the previous selection is still current.
    const chart = new OscillatorChart({} as CanvasRenderingContext2D, seriesLegend);
    const listing = { chartConfig: null } as unknown as IndicatorListing;
    const adx = { ...selection(["ADX(14)"], ["DI+(14)"]), label: "ADX(14)" };

    chart.render(macd, listing);
    chart.render(adx, listing);
    await Promise.resolve();

    const annotations = chart.chart?.options.plugins?.annotation?.annotations as Written;
    expect(annotations.filter(a => !a.id.endsWith("-swatch")).map(a => a.content.join(""))).toEqual(
      ["ADX(14)", "DI+(14)"]
    );
  });

  it("carries the resize handler on the options a theme change assigns", () => {
    const chart = new OscillatorChart({} as CanvasRenderingContext2D, seriesLegend);
    const assigned: Array<{ onResize?: unknown }> = [];
    (chart as unknown as { _chart: unknown })._chart = {
      set options(value: { onResize?: unknown }) {
        assigned.push(value);
      },
      get options() {
        return {};
      },
      update: vi.fn()
    };

    chart.updateTheme({ ...seriesLegend, isDarkTheme: false });

    expect(assigned).toHaveLength(1);
    expect(assigned[0]?.onResize).toBeTypeOf("function");
    expect(assigned[0]?.onResize).toBe((chart as unknown as { _onResize: unknown })._onResize);
  });
});
