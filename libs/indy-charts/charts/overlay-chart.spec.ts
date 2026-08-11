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
