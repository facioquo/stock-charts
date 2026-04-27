import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChartManager } from "./chart-manager";
import type { OverlayChart } from "./overlay-chart";
import type { OscillatorChart } from "./oscillator-chart";
import type {
  ChartSettings,
  IndicatorDataRow,
  IndicatorListing,
  IndicatorSelection,
  Quote
} from "../config/types";

// ---------------------------------------------------------------------------
// Mocks – OverlayChart and OscillatorChart create real Chart.js instances
// which require a canvas context.  We mock them entirely so ChartManager
// logic is tested in isolation without a DOM.
// ---------------------------------------------------------------------------

vi.mock("./overlay-chart", () => {
  const MockOverlayChart = vi.fn(function mockOverlayChart() {
    return Object.assign(this as object, createMockOverlay());
  });
  return { OverlayChart: MockOverlayChart };
});

vi.mock("./oscillator-chart", () => {
  const MockOscillatorChart = vi.fn(function mockOscillatorChart() {
    return Object.assign(this as object, createMockOscillator());
  });
  return { OscillatorChart: MockOscillatorChart };
});

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Create a mock OverlayChart whose `render` returns clonable datasets. */
function createMockOverlay(): Partial<OverlayChart> {
  const datasets = [
    { type: "candlestick" as const, data: [] as unknown[] },
    { type: "bar" as const, data: [] as unknown[], backgroundColor: [] as string[] }
  ];

  return {
    chart: {
      data: { datasets: [...datasets] },
      options: { plugins: { annotation: { annotations: {} } } },
      scales: { x: { min: 0 }, y: { max: 100 } },
      update: vi.fn(),
      destroy: vi.fn()
    } as any,
    render: vi.fn().mockImplementation((quotes: Quote[]) => {
      // Return full-length datasets so slicing can be validated.
      const priceData = quotes.map(q => ({
        x: new Date(q.date).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      }));
      const volumeData = quotes.map(q => ({
        x: new Date(q.date).valueOf(),
        y: q.volume
      }));
      const bgColors = quotes.map(() => "#0f0");

      const full = [
        { type: "candlestick" as const, data: priceData },
        { type: "bar" as const, data: volumeData, backgroundColor: bgColors }
      ];

      // Also set the mock chart data to initial values
      datasets[0].data = [...priceData];
      datasets[1].data = [...volumeData];

      return structuredClone(full);
    }),
    addIndicatorDatasets: vi.fn(),
    removeIndicatorDatasets: vi.fn(),
    updateLegends: vi.fn(),
    updateTheme: vi.fn(),
    applySlicedData: vi.fn().mockImplementation(function (this: any, fullDS: any[], start: number) {
      // Simulate real applySlicedData: slice the chart's datasets
      if (this.chart) {
        fullDS.forEach((full: any, i: number) => {
          if (this.chart.data.datasets[i]) {
            this.chart.data.datasets[i].data = full.data.slice(start);
          }
        });
      }
    }),
    resize: vi.fn(),
    destroy: vi.fn()
  };
}

function createMockOscillator(): Partial<OscillatorChart> {
  return {
    chart: {
      data: { datasets: [] },
      options: { plugins: { annotation: { annotations: {} } } },
      scales: { x: { min: 0 }, y: { max: 100 } },
      update: vi.fn(),
      destroy: vi.fn()
    } as any,
    render: vi.fn(),
    updateLegend: vi.fn(),
    updateTheme: vi.fn(),
    applySlicedData: vi.fn(),
    resize: vi.fn(),
    destroy: vi.fn()
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeQuotes(count: number): Quote[] {
  const quotes: Quote[] = [];
  const start = new Date("2024-01-02");

  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const base = 100 + i * 0.5;
    quotes.push({
      date: d,
      open: base,
      high: base + 2,
      low: base - 2,
      close: base + 1,
      volume: 1_000_000 + i * 10_000
    });
  }
  return quotes;
}

function makeOverlayListing(overrides?: Partial<IndicatorListing>): IndicatorListing {
  return {
    uiid: "SMA",
    name: "Simple Moving Average",
    legendTemplate: "SMA([P1])",
    endpoint: "sma",
    category: "moving-average",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [
      {
        paramName: "lookbackPeriods",
        displayName: "Periods",
        minimum: 1,
        maximum: 200,
        defaultValue: 20
      }
    ],
    results: [
      {
        dataName: "sma",
        displayName: "SMA",
        tooltipTemplate: "SMA: $VALUE",
        defaultColor: "#4169E1",
        lineType: "solid",
        lineWidth: 2,
        dataType: "number",
        stack: "",
        order: 1
      }
    ],
    ...overrides
  } as IndicatorListing;
}

function makeOscillatorListing(overrides?: Partial<IndicatorListing>): IndicatorListing {
  return {
    uiid: "RSI",
    name: "Relative Strength Index",
    legendTemplate: "RSI([P1])",
    endpoint: "rsi",
    category: "oscillator",
    chartType: "oscillator",
    order: 2,
    chartConfig: {
      minimumYAxis: 0,
      maximumYAxis: 100,
      thresholds: [
        { value: 70, color: "#FF0000", style: "dash", fill: null },
        { value: 30, color: "#00FF00", style: "dash", fill: null }
      ]
    },
    parameters: [
      {
        paramName: "lookbackPeriods",
        displayName: "Periods",
        minimum: 1,
        maximum: 200,
        defaultValue: 14
      }
    ],
    results: [
      {
        dataName: "rsi",
        displayName: "RSI",
        tooltipTemplate: "RSI: $VALUE",
        defaultColor: "#8E24AA",
        lineType: "solid",
        lineWidth: 2,
        dataType: "number",
        stack: "",
        order: 1
      }
    ],
    ...overrides
  } as IndicatorListing;
}

function makeSelection(listing: IndicatorListing, ucid: string): IndicatorSelection {
  return {
    ucid,
    uiid: listing.uiid,
    label: listing.legendTemplate,
    chartType: listing.chartType,
    params: (listing.parameters ?? []).map(p => ({
      paramName: p.paramName,
      displayName: p.displayName,
      minimum: p.minimum,
      maximum: p.maximum,
      value: p.defaultValue
    })),
    results: listing.results.map(r => ({
      label: r.displayName,
      dataName: r.dataName,
      color: r.defaultColor,
      lineType: r.lineType,
      lineWidth: r.lineWidth,
      order: r.order,
      dataset: { type: "line" as const, data: [], label: r.displayName }
    }))
  } as IndicatorSelection;
}

function makeIndicatorData(quotes: Quote[]): IndicatorDataRow[] {
  return quotes.map((q, index) => ({
    date: q.date.toISOString(),
    candle: q,
    sma: q.close * 0.99,
    rsi: 50 + (index % 10) // Deterministic value derived from index, not Math.random()
  }));
}

const defaultSettings: ChartSettings = {
  isDarkTheme: false,
  showTooltips: true
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChartManager", () => {
  let mgr: ChartManager;

  beforeEach(() => {
    mgr = new ChartManager({ settings: defaultSettings });
  });

  afterEach(() => {
    mgr.destroy();
  });

  // ----- Construction & defaults -----

  describe("constructor", () => {
    it("stores settings from config", () => {
      expect(mgr.settings).toEqual(defaultSettings);
    });

    it("does not expose mutable settings references", () => {
      const externalSettings: ChartSettings = { isDarkTheme: false, showTooltips: true };
      const custom = new ChartManager({ settings: externalSettings });

      externalSettings.isDarkTheme = true;
      const exposedSettings = custom.settings;
      exposedSettings.showTooltips = false;

      expect(custom.settings).toEqual({ isDarkTheme: false, showTooltips: true });
      custom.destroy();
    });

    it("starts with empty selections and no overlay chart", () => {
      expect(mgr.selections).toHaveLength(0);
      expect(mgr.overlayChart).toBeUndefined();
      expect(mgr.oscillators.size).toBe(0);
    });

    it("defaults currentBarCount to 250", () => {
      expect(mgr.currentBarCount).toBe(250);
    });

    it("accepts custom extraBars", () => {
      const custom = new ChartManager({ settings: defaultSettings, extraBars: 10 });
      // Verify ChartManager accepts the extraBars option in configuration
      expect(custom.settings).toEqual(defaultSettings);
      custom.destroy();
    });
  });

  // ----- initializeOverlay -----

  describe("initializeOverlay", () => {
    it("creates an overlay chart and stores quotes", () => {
      const quotes = makeQuotes(100);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 50);

      expect(mgr.overlayChart).toBeDefined();
      expect(mgr.allQuotes).toHaveLength(100);
      expect(mgr.currentBarCount).toBe(50);
    });

    it("calls OverlayChart.render with the full quotes", () => {
      const quotes = makeQuotes(80);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 40);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(overlay.render).toHaveBeenCalledWith(quotes, 7); // default extraBars
    });

    it("applies initial bar-count slice via applySlicedData", () => {
      const quotes = makeQuotes(100);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 30);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      // startIndex = 100 - 30 = 70
      expect(overlay.applySlicedData).toHaveBeenCalledWith(expect.any(Array), 70);
    });

    it("normalizes the initial bar count before slicing", () => {
      const quotes = makeQuotes(100);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 0);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(mgr.currentBarCount).toBe(1);
      expect(overlay.applySlicedData).toHaveBeenCalledWith(expect.any(Array), 99);
    });

    it("destroys a previous overlay before creating a new one", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);
      const firstOverlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;

      mgr.initializeOverlay(ctx, makeQuotes(60), 30);

      expect(firstOverlay.destroy).toHaveBeenCalled();
      expect(mgr.allQuotes).toHaveLength(60);
    });
  });

  // ----- processSelectionData -----

  describe("processSelectionData", () => {
    it("populates selection.results[].dataset.data from indicator rows", () => {
      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "sel-1");
      const quotes = makeQuotes(50);
      const data = makeIndicatorData(quotes);

      mgr.processSelectionData(selection, listing, data);

      // dataset should now have data points
      expect(selection.results[0].dataset.data.length).toBeGreaterThan(0);
    });

    it("stores a deep copy for later resizing", () => {
      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "sel-2");
      const quotes = makeQuotes(30);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 15);
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);

      selection.results[0].dataset.data = [];
      mgr.setBarCount(20);

      expect(selection.results[0].dataset.data.length).toBeGreaterThan(0);
    });
  });

  // ----- displaySelection -----

  describe("displaySelection", () => {
    it("registers an overlay selection and adds datasets to the overlay chart", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "sel-overlay");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(50)));

      mgr.displaySelection(selection, listing);

      expect(mgr.selections).toHaveLength(1);
      expect(mgr.selections[0].ucid).toBe("sel-overlay");

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(overlay.addIndicatorDatasets).toHaveBeenCalled();
      expect(overlay.updateLegends).toHaveBeenCalled();
    });

    it("does not register the same ucid twice", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "dup");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(50)));

      mgr.displaySelection(selection, listing);
      mgr.displaySelection(selection, listing);

      expect(mgr.selections).toHaveLength(1);
    });

    it("registers an oscillator selection without creating a chart", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "sel-osc");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));

      mgr.displaySelection(selection, listing);

      expect(mgr.selections).toHaveLength(1);
      expect(mgr.oscillators.size).toBe(0); // not yet — consumer calls createOscillator
    });
  });

  // ----- createOscillator -----

  describe("createOscillator", () => {
    it("creates and stores an oscillator for a registered selection", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-1");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));
      mgr.displaySelection(selection, listing);

      const ctx = {} as CanvasRenderingContext2D;
      const osc = mgr.createOscillator(ctx, selection, listing);

      expect(osc).toBeDefined();
      expect(mgr.oscillators.size).toBe(1);
      expect(osc.render).toHaveBeenCalledWith(selection, listing);
    });

    it("throws if selection is not registered via displaySelection", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "not-registered");
      const ctx = {} as CanvasRenderingContext2D;

      expect(() => mgr.createOscillator(ctx, selection, listing)).toThrow(/not been registered/);
    });

    it("destroys a previous oscillator for the same ucid", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-replace");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));
      mgr.displaySelection(selection, listing);

      const ctx = {} as CanvasRenderingContext2D;
      const first = mgr.createOscillator(ctx, selection, listing);
      mgr.createOscillator(ctx, selection, listing);

      expect(first.destroy).toHaveBeenCalled();
      expect(mgr.oscillators.size).toBe(1);
    });
  });

  // ----- removeSelection -----

  describe("removeSelection", () => {
    it("removes an overlay selection and its datasets from the chart", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "rm-overlay");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(50)));
      mgr.displaySelection(selection, listing);

      mgr.removeSelection("rm-overlay");

      expect(mgr.selections).toHaveLength(0);
      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(overlay.removeIndicatorDatasets).toHaveBeenCalledWith(selection.results);
    });

    it("removes an oscillator selection and destroys its chart", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "rm-osc");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));
      mgr.displaySelection(selection, listing);

      const ctx = {} as CanvasRenderingContext2D;
      const osc = mgr.createOscillator(ctx, selection, listing);

      mgr.removeSelection("rm-osc");

      expect(mgr.selections).toHaveLength(0);
      expect(osc.destroy).toHaveBeenCalled();
      expect(mgr.oscillators.size).toBe(0);
    });

    it("is a no-op for unknown ucid", () => {
      mgr.removeSelection("nonexistent");
      expect(mgr.selections).toHaveLength(0);
    });
  });

  // ----- updateTheme -----

  describe("updateTheme", () => {
    it("updates settings on the manager", () => {
      const dark: ChartSettings = { isDarkTheme: true, showTooltips: false };
      mgr.updateTheme(dark);

      expect(mgr.settings).toEqual(dark);
    });

    it("propagates theme to overlay chart", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      const dark: ChartSettings = { isDarkTheme: true, showTooltips: true };
      mgr.updateTheme(dark);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(overlay.updateTheme).toHaveBeenCalledWith(dark);
      expect(overlay.updateLegends).toHaveBeenCalled();
    });

    it("propagates theme to all oscillators", () => {
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "theme-osc");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));
      mgr.displaySelection(selection, listing);

      const ctx = {} as CanvasRenderingContext2D;
      const osc = mgr.createOscillator(ctx, selection, listing);

      const dark: ChartSettings = { isDarkTheme: true, showTooltips: true };
      mgr.updateTheme(dark);

      expect(osc.updateTheme).toHaveBeenCalledWith(dark);
      expect(osc.updateLegend).toHaveBeenCalledWith(selection);
    });
  });

  // ----- setBarCount -----

  describe("setBarCount", () => {
    it("is a no-op when no quotes are loaded", () => {
      mgr.setBarCount(100);
      expect(mgr.currentBarCount).toBe(250); // unchanged from default
    });

    it("updates currentBarCount and calls overlay applySlicedData", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(100), 50);
      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;

      // Clear mock call counts from initializeOverlay
      vi.mocked(overlay.applySlicedData!).mockClear();

      mgr.setBarCount(30);

      expect(mgr.currentBarCount).toBe(30);
      // startIndex = 100 - 30 = 70
      expect(overlay.applySlicedData).toHaveBeenCalledWith(expect.any(Array), 70);
    });

    it("clamps barCount to [1, totalQuotes]", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      mgr.setBarCount(0);
      expect(mgr.currentBarCount).toBe(1);

      mgr.setBarCount(999);
      expect(mgr.currentBarCount).toBe(50);
    });

    it("is a no-op when barCount matches current", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(100), 50);
      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;

      vi.mocked(overlay.applySlicedData!).mockClear();

      mgr.setBarCount(50);
      expect(overlay.applySlicedData).not.toHaveBeenCalled();
    });

    it("slices overlay indicator datasets for windowed alignment", () => {
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(100);
      mgr.initializeOverlay(ctx, quotes, 50);

      const listing = makeOverlayListing();
      const selection = makeSelection(listing, "slice-test");
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);

      // The dataset should have been populated by processSelectionData
      const originalLength = selection.results[0].dataset.data.length;
      expect(originalLength).toBeGreaterThan(0);

      mgr.setBarCount(20);

      // After setBarCount(20), startIndex = 100 - 20 = 80
      // Data has extra 7 bars appended, so total points = 107.
      // Sliced from index 80 = 107 - 80 = 27 points.
      const slicedLength = selection.results[0].dataset.data.length;
      expect(slicedLength).toBeLessThanOrEqual(20 + 7); // +7 for extraBars
    });

    it("updates oscillator charts via applySlicedData", () => {
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(100);
      mgr.initializeOverlay(ctx, quotes, 50);

      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-slice");
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);
      const osc = mgr.createOscillator(ctx, selection, listing);

      mgr.setBarCount(30);

      // startIndex = 100 - 30 = 70
      expect(osc.applySlicedData).toHaveBeenCalledWith(selection, expect.any(Array), 70);
    });

    it("handles non-finite barCount gracefully", () => {
      const ctx = {} as CanvasRenderingContext2D;
      mgr.initializeOverlay(ctx, makeQuotes(50), 25);

      // Infinity is not finite → normalizedBarCount falls back to 1
      mgr.setBarCount(Infinity);
      expect(mgr.currentBarCount).toBe(1);

      // Reset to a known value so the next assertion is meaningful
      mgr.setBarCount(25);
      expect(mgr.currentBarCount).toBe(25);

      // NaN is not finite → normalizedBarCount falls back to 1
      mgr.setBarCount(NaN);
      expect(mgr.currentBarCount).toBe(1);
    });
  });

  // ----- destroy -----

  describe("destroy", () => {
    it("destroys overlay and oscillators and clears state", () => {
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(50);
      mgr.initializeOverlay(ctx, quotes, 25);

      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "dest-osc");
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);
      const osc = mgr.createOscillator(ctx, selection, listing);

      const overlay = mgr.overlayChart;

      mgr.destroy();

      expect((overlay as any)?.destroy).toHaveBeenCalled();
      expect(osc.destroy).toHaveBeenCalled();
      expect(mgr.overlayChart).toBeUndefined();
      expect(mgr.oscillators.size).toBe(0);
      expect(mgr.selections).toHaveLength(0);
      expect(mgr.allQuotes).toHaveLength(0);
    });

    it("is safe to call when nothing was initialized", () => {
      expect(() => mgr.destroy()).not.toThrow();
    });
  });
});
