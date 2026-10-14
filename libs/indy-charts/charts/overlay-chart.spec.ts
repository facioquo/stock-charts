import { describe, expect, it, vi } from "vitest";

import { OverlayChart } from "./overlay-chart";
import { type ChartSettings } from "../config/types";

const settings: ChartSettings = { isDarkTheme: true, showTooltips: false };

interface StubDataset {
  label: string;
  type: string;
  hidden?: boolean;
}

/**
 * `setPriceVisibility` reaches only into `_chart.data.datasets`, so a stub
 * stands in for a live Chart.js instance and canvas.
 */
function withDatasets(datasets: StubDataset[]): {
  overlay: OverlayChart;
  update: ReturnType<typeof vi.fn>;
} {
  const update = vi.fn();
  const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);
  (overlay as unknown as { _chart: unknown })._chart = { data: { datasets }, update };
  return { overlay, update };
}

/** The overlay's fixed dataset order: price candles first, volume second. */
function priceAndVolume(): StubDataset[] {
  return [
    { label: "Price", type: "candlestick" },
    { label: "Volume", type: "bar" }
  ];
}

describe("OverlayChart.setPriceVisibility", () => {
  it("hides the raw price candles without touching volume", () => {
    // A candle-rendered indicator (e.g. Heikin-Ashi) replaces the price candles
    // because both sit at nearly the same prices. Volume is a separate series
    // on its own axis and must keep rendering either way.
    const datasets = priceAndVolume();
    const { overlay, update } = withDatasets(datasets);

    overlay.setPriceVisibility(false);

    expect(datasets[0].hidden).toBe(true);
    expect(datasets[1].hidden).toBeUndefined();
    expect(update).toHaveBeenCalledWith("none");
  });

  it("restores the price candles when the candle overlay goes away", () => {
    const datasets = priceAndVolume();
    datasets[0].hidden = true;
    const { overlay } = withDatasets(datasets);

    overlay.setPriceVisibility(true);

    expect(datasets[0].hidden).toBe(false);
    expect(datasets[1].hidden).toBeUndefined();
  });

  it("leaves the datasets alone when the first one is not the price candles", () => {
    const datasets: StubDataset[] = [{ label: "Volume", type: "bar" }];
    const { overlay, update } = withDatasets(datasets);

    overlay.setPriceVisibility(false);

    expect(datasets[0].hidden).toBeUndefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("no-ops before the chart is rendered", () => {
    const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);

    expect(() => overlay.setPriceVisibility(false)).not.toThrow();
  });
});

describe("OverlayChart.reorderIndicatorDatasets", () => {
  it("restacks the indicator datasets after price and volume in the given order", () => {
    const [price, volume] = priceAndVolume();
    const a = { label: "A", type: "line" };
    const b = { label: "B", type: "line" };
    const c = { label: "C", type: "line" };
    const datasets = [price, volume, a, b, c];
    const { overlay, update } = withDatasets(datasets);

    overlay.reorderIndicatorDatasets(
      [c, a, b].map(dataset => ({ dataset })) as unknown as Parameters<
        OverlayChart["reorderIndicatorDatasets"]
      >[0]
    );

    expect(datasets.map(d => d.label)).toEqual(["Price", "Volume", "C", "A", "B"]);
    expect(update).toHaveBeenCalledWith("none");
  });

  it("no-ops before the chart is rendered", () => {
    const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);

    expect(() => overlay.reorderIndicatorDatasets([])).not.toThrow();
  });
});

describe("OverlayChart.updateLegends", () => {
  it("lists legends in selection order, not alphabetically", () => {
    const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);
    const annotations: Array<{ content?: unknown }> = [];
    (overlay as unknown as { _chart: unknown })._chart = {
      scales: { x: { min: 0 }, y: { max: 100 } },
      options: { plugins: { annotation: { annotations } } },
      update: vi.fn()
    };
    const overlays = ["ATR-STOP", "LINEAR", "MARUBOZU", "BB"].map(label => ({
      ucid: label,
      label,
      chartType: "overlay",
      results: [{ color: "#fff" }]
    }));

    overlay.updateLegends(overlays as unknown as Parameters<OverlayChart["updateLegends"]>[0]);

    const written = (
      (overlay as unknown as { _chart: { options: { plugins: { annotation: unknown } } } })._chart
        .options.plugins.annotation as {
        annotations: Array<{ id?: string; content: string[] | string }>;
      }
    ).annotations.filter(a => !a.id?.endsWith("-swatch"));
    expect(written.map(a => [a.content].flat().join(""))).toEqual([
      "ATR-STOP",
      "LINEAR",
      "MARUBOZU",
      "BB"
    ]);
  });
});

describe("OverlayChart legend block", () => {
  function legendChart(width: number) {
    const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);
    const options = {
      layout: { padding: { top: 0, left: 1, bottom: 0, right: 1 } },
      plugins: { annotation: { annotations: {} as unknown } }
    };
    (overlay as unknown as { _chart: unknown })._chart = {
      width,
      scales: { x: { min: 0 }, y: { max: 100 } },
      options,
      update: vi.fn()
    };
    return { overlay, options };
  }
  const selections = ["LINEAR(50)", "BB(20,2)", "SUPERTREND(10,3)", "MARUBOZU(90%)"].map(label => ({
    ucid: label,
    label,
    chartType: "overlay",
    results: [{ color: "#abc123" }]
  }));
  type Listed = Parameters<OverlayChart["updateLegends"]>[0];

  it("reserves the legend height as top padding and keeps the other sides", () => {
    const { overlay, options } = legendChart(1000);

    overlay.updateLegends(selections as unknown as Listed);

    expect(options.layout.padding.top).toBeGreaterThan(0);
    expect(options.layout.padding).toMatchObject({ left: 1, right: 1, bottom: 0 });
  });

  it("wraps onto more rows at a narrow width", () => {
    const wide = legendChart(1000);
    const narrow = legendChart(160);

    wide.overlay.updateLegends(selections as unknown as Listed);
    narrow.overlay.updateLegends(selections as unknown as Listed);

    expect(narrow.options.layout.padding.top).toBeGreaterThan(wide.options.layout.padding.top);
  });

  it("colours the swatch by series and the label by theme", () => {
    const { overlay, options } = legendChart(1000);

    overlay.updateLegends(selections as unknown as Listed);

    const written = options.plugins.annotation.annotations as Array<{ id: string; color: string }>;
    const swatch = written.find(a => a.id === "legend1-swatch");
    const label = written.find(a => a.id === "legend1");
    expect(swatch?.color).toBe("#abc123");
    expect(label?.color).not.toBe("#abc123");
  });

  it("wraps to the plot area, not the full canvas, when the axis labels take the right edge", () => {
    const { overlay, options } = legendChart(1000);
    const chart = (overlay as unknown as { _chart: Record<string, unknown> })._chart;
    chart["chartArea"] = { left: 0, right: 160 };

    overlay.updateLegends(selections as unknown as Listed);

    const full = legendChart(1000);
    full.overlay.updateLegends(selections as unknown as Listed);
    expect(options.layout.padding.top).toBeGreaterThan(full.options.layout.padding.top);
  });

  it("re-lays the legend out when the chart is resized", async () => {
    const { overlay, options } = legendChart(1000);
    overlay.updateLegends(selections as unknown as Listed);
    const wide = options.layout.padding.top;

    const chart = (overlay as unknown as { _chart: { width: number } })._chart;
    chart.width = 160;
    (overlay as unknown as { _onResize: () => void })._onResize();
    await Promise.resolve();

    expect(options.layout.padding.top).toBeGreaterThan(wide);
  });

  it("measures with a fallback when the canvas context is partial", () => {
    const { overlay, options } = legendChart(1000);
    const chart = (overlay as unknown as { _chart: Record<string, unknown> })._chart;
    chart["ctx"] = { measureText: () => ({ width: 10 }) };

    expect(() => overlay.updateLegends(selections as unknown as Listed)).not.toThrow();
    expect(options.layout.padding.top).toBeGreaterThan(0);
  });

  it("clears the reserved height when no overlay is listed", () => {
    const { overlay, options } = legendChart(1000);
    overlay.updateLegends(selections as unknown as Listed);

    overlay.updateLegends([]);

    expect(options.layout.padding.top).toBe(0);
  });
});

describe("OverlayChart.applySlicedData", () => {
  it("sizes the volume axis from the bars on screen", () => {
    const overlay = new OverlayChart({} as CanvasRenderingContext2D, settings);
    const volumeAxis = { max: 0 };
    const datasets = [
      { type: "candlestick", data: [] as unknown[] },
      { type: "bar", data: [] as unknown[] }
    ];
    (overlay as unknown as { _chart: unknown })._chart = {
      data: { datasets },
      options: { scales: { volumeAxis } },
      update: vi.fn()
    };
    const history = [100, 100, 100, 100, 1000, 1000, 1000, 1000];
    const full = [
      { type: "candlestick", data: history.map(() => ({})) },
      {
        type: "bar",
        data: [...history.map((y, x) => ({ x, y })), { x: 8, y: Number.NaN }]
      }
    ];
    const apply = (start: number, end?: number): void =>
      overlay.applySlicedData(
        full as unknown as Parameters<OverlayChart["applySlicedData"]>[0],
        start,
        end
      );

    apply(0, 4);
    expect(volumeAxis.max).toBe(20 * 100);

    // Panned to the heavier stretch: the axis follows; the padding bar is ignored.
    apply(4);
    expect(volumeAxis.max).toBe(20 * 1000);
  });
});
