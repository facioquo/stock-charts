import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Chart, ChartDataset } from "chart.js";

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

/**
 * Subset of `Chart` that our mocked OverlayChart/OscillatorChart expose. Keeping
 * a typed shape avoids `as any` while making it explicit which Chart.js fields
 * the chart-manager logic actually reads.
 */
type MockChartShape = Pick<Chart, "data" | "options" | "scales" | "update" | "destroy">;

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
    } as unknown as Chart,
    render: vi.fn().mockImplementation((quotes: Quote[]) => {
      // Return full-length datasets so slicing can be validated.
      const priceData = quotes.map(q => ({
        x: new Date(q.timestamp).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      }));
      const volumeData = quotes.map(q => ({
        x: new Date(q.timestamp).valueOf(),
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
    buildFullDatasets: vi.fn().mockImplementation((quotes: Quote[]) => {
      const priceData = quotes.map(q => ({
        x: new Date(q.timestamp).valueOf(),
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      }));
      const volumeData = quotes.map(q => ({
        x: new Date(q.timestamp).valueOf(),
        y: q.volume
      }));
      const bgColors = quotes.map(() => "#0f0");
      return structuredClone([
        { type: "candlestick" as const, data: priceData },
        { type: "bar" as const, data: volumeData, backgroundColor: bgColors }
      ]);
    }),
    applySlicedData: vi.fn().mockImplementation(function (
      this: { chart?: MockChartShape },
      fullDS: ChartDataset[],
      start: number
    ) {
      // Simulate real applySlicedData: slice the chart's datasets
      if (!this.chart) return;
      fullDS.forEach((full, i) => {
        const target = this.chart?.data.datasets[i];
        if (target && Array.isArray(full.data)) {
          target.data = full.data.slice(start);
        }
      });
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
    } as unknown as Chart,
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
      timestamp: d,
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
    timestamp: new Date(q.timestamp).toISOString(),
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

    it("calls OverlayChart.render with sliced quotes and buildFullDatasets with all quotes", () => {
      const quotes = makeQuotes(80);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 40);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      // render receives the visible slice only (last 40 of 80, startIndex=40)
      const renderArg = vi.mocked(overlay.render!).mock.calls[0][0];
      expect(renderArg).toHaveLength(40);
      expect(vi.mocked(overlay.render!).mock.calls[0][1]).toBe(6); // default extraBars
      // buildFullDatasets receives all quotes so full history is cached
      expect(overlay.buildFullDatasets).toHaveBeenCalledWith(quotes, 6);
    });

    it("renders with sliced quotes (no separate applySlicedData on init)", () => {
      const quotes = makeQuotes(100);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 30);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      // Chart is initialized with sliced data directly — no separate applySlicedData call
      const renderArg = vi.mocked(overlay.render!).mock.calls[0][0];
      // startIndex = 100 - 30 = 70; render receives last 30 quotes
      expect(renderArg).toHaveLength(30);
      expect(overlay.applySlicedData).not.toHaveBeenCalled();
    });

    it("normalizes the initial bar count before slicing", () => {
      const quotes = makeQuotes(100);
      const ctx = {} as CanvasRenderingContext2D;

      mgr.initializeOverlay(ctx, quotes, 0);

      const overlay = mgr.overlayChart as unknown as ReturnType<typeof createMockOverlay>;
      expect(mgr.currentBarCount).toBe(1);
      // render receives last 1 quote (startIndex=99)
      const renderArg = vi.mocked(overlay.render!).mock.calls[0][0];
      expect(renderArg).toHaveLength(1);
      expect(overlay.applySlicedData).not.toHaveBeenCalled();
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

    it("colors histogram bars per the <dataName>IsExpanding flags", () => {
      // Gator-style oscillator: two bar histograms whose color encodes whether
      // each bar is expanding (green) or contracting (red), per the standard
      // depiction — not a single static color per series.
      const listing = makeOscillatorListing({
        uiid: "GATOR",
        category: "price-trend",
        chartConfig: null,
        parameters: [],
        results: [
          {
            dataName: "upper",
            displayName: "Upper",
            tooltipTemplate: "Upper",
            defaultColor: "#2E7D32",
            lineType: "bar",
            lineWidth: 2,
            dataType: "number",
            stack: "gator",
            order: 1
          },
          {
            dataName: "lower",
            displayName: "Lower",
            tooltipTemplate: "Lower",
            defaultColor: "#DD2C00",
            lineType: "bar",
            lineWidth: 2,
            dataType: "number",
            stack: "gator",
            order: 2
          }
        ]
      });
      const selection = makeSelection(listing, "gator-1");
      const quotes = makeQuotes(4);
      const data: IndicatorDataRow[] = quotes.map((q, i) => ({
        timestamp: new Date(q.timestamp).toISOString(),
        upper: 5 + i,
        lower: -(5 + i),
        upperIsExpanding: i % 2 === 0,
        lowerIsExpanding: i % 2 === 1
      }));

      mgr.processSelectionData(selection, listing, data);

      const upperBg = selection.results[0].dataset.backgroundColor as string[];
      const lowerBg = selection.results[1].dataset.backgroundColor as string[];
      expect(selection.results[0].dataset.type).toBe("bar");
      expect(upperBg.slice(0, 4)).toEqual(["#2E7D32", "#DD2C00", "#2E7D32", "#DD2C00"]);
      expect(lowerBg.slice(0, 4)).toEqual(["#DD2C00", "#2E7D32", "#DD2C00", "#2E7D32"]);
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

    it("rejects the reserved 'overlay-main' ucid", () => {
      // Internal _allProcessedDatasets cache keys both the overlay candlestick
      // bundle (under "overlay-main") and per-selection indicator datasets
      // (under selection.ucid). A collision would mis-cast candlestick data as
      // indicator data inside applySlicedData. Guard at the displaySelection
      // boundary so consumers learn about the conflict immediately.
      const listing = makeOscillatorListing();
      const colliding = makeSelection(listing, "overlay-main");
      mgr.processSelectionData(colliding, listing, makeIndicatorData(makeQuotes(30)));

      expect(() => mgr.displaySelection(colliding, listing)).toThrow(/reserved for internal use/);
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

    it("throws when processSelectionData was skipped (regardless of windowing)", () => {
      // Reaching createOscillator without populated processed datasets is a
      // contract violation in every viewport state — failing only under a
      // windowed overlay would produce works-on-desktop / throws-on-mobile
      // ticket noise. Verify the throw fires both with and without a window.
      const ctx = {} as CanvasRenderingContext2D;
      const listing = makeOscillatorListing();

      // Case 1: windowed overlay
      mgr.initializeOverlay(ctx, makeQuotes(100), 50);
      const windowedSel = makeSelection(listing, "osc-missing-windowed");
      mgr.displaySelection(windowedSel, listing);
      expect(() => mgr.createOscillator(ctx, windowedSel, listing)).toThrow(
        /has no processed datasets/
      );

      // Case 2: no overlay at all (allQuotes empty → currentBarCount === 0)
      const fresh = new ChartManager({ settings: defaultSettings });
      const standaloneSel = makeSelection(listing, "osc-missing-standalone");
      fresh.displaySelection(standaloneSel, listing);
      expect(() => fresh.createOscillator(ctx, standaloneSel, listing)).toThrow(
        /has no processed datasets/
      );
      fresh.destroy();
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

    it("renders with full data and does not slice when no overlay window is set", () => {
      // Without an initialized overlay (allQuotes is empty), createOscillator
      // renders with the full dataset and does not slice. Threshold datasets
      // captured during render retain full history for future setBarCount() calls.
      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-standalone");
      mgr.processSelectionData(selection, listing, makeIndicatorData(makeQuotes(30)));
      mgr.displaySelection(selection, listing);

      const ctx = {} as CanvasRenderingContext2D;
      const osc = mgr.createOscillator(ctx, selection, listing);

      // render must be called with full data so fullThresholdDatasets has all history
      expect(osc.render).toHaveBeenCalledWith(selection, listing);
      // No overlay → no window to align to → no slice on init
      expect(osc.applySlicedData).not.toHaveBeenCalled();
    });

    it("slices oscillator on initial create to align with a windowed overlay", () => {
      // With an overlay initialized to a smaller window, createOscillator must
      // immediately apply the current viewport slice so the new oscillator's
      // x-axis matches the overlay from the first paint — fixing the race
      // where oscillators created during/after a resize would otherwise span
      // the full quote history.
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(100);
      mgr.initializeOverlay(ctx, quotes, 50); // allQuotes=100, currentBarCount=50

      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-overlay-viewport");
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);

      const osc = mgr.createOscillator(ctx, selection, listing);

      expect(osc.render).toHaveBeenCalledWith(selection, listing);
      // startIndex = 100 - 50 = 50
      expect(osc.applySlicedData).toHaveBeenCalledWith(selection, expect.any(Array), 50);
      // Verify the cached datasets were passed (non-empty and same shape as the
      // selection's results so a wrong-key regression on _allProcessedDatasets
      // would fail this assertion, not just slip through expect.any(Array)).
      const passedDatasets = vi.mocked(osc.applySlicedData).mock.calls[0][1];
      expect(passedDatasets.length).toBe(selection.results.length);
      expect(passedDatasets.every(ds => Array.isArray(ds.data) && ds.data.length > 0)).toBe(true);
    });

    it("does not slice on initial create when currentBarCount covers all quotes", () => {
      // When the viewport already fits every quote, slicing would be a no-op
      // and skipping it avoids an unnecessary chart.update pass.
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(50);
      mgr.initializeOverlay(ctx, quotes, 50); // allQuotes=50, currentBarCount=50

      const listing = makeOscillatorListing();
      const selection = makeSelection(listing, "osc-full-window");
      mgr.processSelectionData(selection, listing, makeIndicatorData(quotes));
      mgr.displaySelection(selection, listing);

      const osc = mgr.createOscillator(ctx, selection, listing);

      expect(osc.render).toHaveBeenCalledWith(selection, listing);
      expect(osc.applySlicedData).not.toHaveBeenCalled();
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
      // Data has extra 6 bars appended, so total points = 106.
      // Sliced from index 80 = 106 - 80 = 26 points.
      const slicedLength = selection.results[0].dataset.data.length;
      expect(slicedLength).toBeLessThanOrEqual(20 + 6); // +6 for extraBars
    });

    it("slices a bar dataset's backgroundColor array in sync with the window", () => {
      const ctx = {} as CanvasRenderingContext2D;
      const quotes = makeQuotes(100);
      mgr.initializeOverlay(ctx, quotes, 50);

      // Overlay bar histogram with per-bar expanding/contracting colors. The
      // backgroundColor array must follow the window like the data and point
      // arrays, otherwise colors would shift relative to the visible bars.
      const listing = makeOverlayListing({
        uiid: "GATOR-OVERLAY",
        category: "price-trend",
        parameters: [],
        results: [
          {
            dataName: "upper",
            displayName: "Upper",
            tooltipTemplate: "Upper",
            defaultColor: "#000000",
            lineType: "bar",
            lineWidth: 2,
            dataType: "number",
            stack: "g",
            order: 1
          }
        ]
      });
      const selection = makeSelection(listing, "bg-slice");
      const data: IndicatorDataRow[] = quotes.map((q, i) => ({
        timestamp: new Date(q.timestamp).toISOString(),
        upper: i,
        upperIsExpanding: i % 2 === 0
      }));
      mgr.processSelectionData(selection, listing, data);
      mgr.displaySelection(selection, listing);

      mgr.setBarCount(20);

      // startIndex = 100 - 20 = 80; the color array (one per quote, no extra
      // bars) slices to 20 entries, still aligned to the visible bars.
      const bg = selection.results[0].dataset.backgroundColor as string[];
      expect(bg).toHaveLength(20);
      expect(bg[0]).toBe("#2E7D32"); // quote 80 is expanding → green
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

      expect(overlay?.destroy).toHaveBeenCalled();
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
