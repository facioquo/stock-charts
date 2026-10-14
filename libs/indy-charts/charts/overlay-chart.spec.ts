import { describe, expect, it, vi } from "vitest";

import {
  LEGEND_BLOCK_MAX_WIDTH,
  LEGEND_BOTTOM_GAP,
  LEGEND_ROW_HEIGHT,
  LEGEND_SWATCH_WIDTH
} from "../config/legend";
import { getThemeColors } from "../config/theme-colors";
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

describe("OverlayChart legend layout", () => {
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
  type Written = Array<{
    id: string;
    color: string;
    xAdjust: number;
    yAdjust: number;
  }>;
  const written = (options: { plugins: { annotation: { annotations: unknown } } }) =>
    options.plugins.annotation.annotations as Written;
  const listed = (n: number) => selections.slice(0, n) as unknown as Listed;

  describe("on a wide chart", () => {
    it("keeps the legend inside the plot with no reserved padding", () => {
      const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH + 1);

      overlay.updateLegends(selections as unknown as Listed);

      expect(options.layout.padding).toEqual({ top: 0, left: 1, bottom: 0, right: 1 });
    });

    it("writes one series-coloured annotation per entry, stepping down a row each", () => {
      const { overlay, options } = legendChart(1000);

      overlay.updateLegends(selections as unknown as Listed);

      const entries = written(options);
      expect(entries.map(a => a.id)).toEqual(["legend1", "legend2", "legend3", "legend4"]);
      expect(entries.map(a => a.color)).toEqual(Array(4).fill("#abc123"));
      expect(entries.map(a => a.yAdjust)).toEqual([10, 25, 40, 55]);
    });
  });

  describe("on a narrow chart", () => {
    it("reserves exactly the rows it needs as top padding and keeps the other sides", () => {
      const one = legendChart(LEGEND_BLOCK_MAX_WIDTH);
      const two = legendChart(160);

      one.overlay.updateLegends(listed(1));
      two.overlay.updateLegends(selections as unknown as Listed);

      expect(one.options.layout.padding).toEqual({
        top: LEGEND_ROW_HEIGHT + LEGEND_BOTTOM_GAP,
        left: 1,
        bottom: 0,
        right: 1
      });
      expect(two.options.layout.padding.top).toBeGreaterThan(one.options.layout.padding.top);
      expect((two.options.layout.padding.top - LEGEND_BOTTOM_GAP) % LEGEND_ROW_HEIGHT).toBe(0);
    });

    it("wraps onto two rows when four entries do not fit one", () => {
      const { overlay, options } = legendChart(160);

      overlay.updateLegends(listed(2));

      const rows = (options.layout.padding.top - LEGEND_BOTTOM_GAP) / LEGEND_ROW_HEIGHT;
      expect(rows).toBe(2);
    });

    it("aligns the swatch and label on one row, with the label after the swatch", () => {
      const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH);

      overlay.updateLegends(listed(1));

      const entries = written(options);
      const swatch = entries.find(a => a.id === "legend1-swatch");
      const label = entries.find(a => a.id === "legend1");
      expect(swatch?.xAdjust).toBe(0);
      expect(label?.xAdjust).toBe(LEGEND_SWATCH_WIDTH);
      expect(swatch?.yAdjust).toBe(label?.yAdjust);
    });

    it("colours the swatch by series and the label by theme text", () => {
      const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH);

      overlay.updateLegends(listed(1));

      const entries = written(options);
      expect(entries.find(a => a.id === "legend1-swatch")?.color).toBe("#abc123");
      expect(entries.find(a => a.id === "legend1")?.color).toBe(getThemeColors(settings).text);
    });

    it("wraps to the plot area, not the full canvas, when the axis labels take the right edge", () => {
      const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH);
      const chart = (overlay as unknown as { _chart: Record<string, unknown> })._chart;
      chart["chartArea"] = { left: 0, right: 160 };
      const full = legendChart(LEGEND_BLOCK_MAX_WIDTH);

      overlay.updateLegends(selections as unknown as Listed);
      full.overlay.updateLegends(selections as unknown as Listed);

      expect(options.layout.padding.top).toBeGreaterThan(full.options.layout.padding.top);
    });

    it("measures with a fallback when the canvas context is partial", () => {
      const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH);
      const chart = (overlay as unknown as { _chart: Record<string, unknown> })._chart;
      chart["ctx"] = { measureText: () => ({ width: 10 }) };

      expect(() => overlay.updateLegends(listed(1))).not.toThrow();
      expect(options.layout.padding.top).toBe(LEGEND_ROW_HEIGHT + LEGEND_BOTTOM_GAP);
    });
  });

  it("switches layout when a resize crosses the threshold", async () => {
    const { overlay, options } = legendChart(1000);
    overlay.updateLegends(selections as unknown as Listed);
    expect(options.layout.padding.top).toBe(0);

    const chart = (overlay as unknown as { _chart: { width: number } })._chart;
    chart.width = 400;
    (overlay as unknown as { _onResize: () => void })._onResize();
    await Promise.resolve();

    expect(options.layout.padding.top).toBeGreaterThan(0);
    expect(written(options).some(a => a.id === "legend1-swatch")).toBe(true);
  });

  it("clears the reserved height when no overlay is listed", () => {
    const { overlay, options } = legendChart(LEGEND_BLOCK_MAX_WIDTH);
    overlay.updateLegends(selections as unknown as Listed);

    overlay.updateLegends([]);

    expect(options.layout.padding.top).toBe(0);
  });
});
