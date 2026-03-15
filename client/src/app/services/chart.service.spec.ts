import "@angular/compiler"; // Required for JIT compilation in tests
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { of, Subject } from "rxjs";

import { ChartManager, setupIndyCharts } from "@facioquo/indy-charts";
import { ChartService } from "./chart.service";
import { ApiService } from "./api.service";
import { UserService } from "./user.service";
import { UtilityService } from "./utility.service";
import { WindowService } from "./window.service";
import type {
  IndicatorListing,
  Quote,
  IndicatorSelection,
  IndicatorDataRow
} from "@facioquo/indy-charts";

/**
 * Mock canvas context for Chart.js rendering.
 */
function createCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const base = {
    canvas,
    // length: 0 prevents Chart.js's getCanvas() helper from treating this context
    // proxy as an array-like (item && item.length → item = item[0]) which would
    // cause acquireContext() to receive a function instead of the canvas element,
    // resulting in chart.ctx being null and "Failed to create chart" errors.
    length: 0,
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    textAlign: "left",
    textBaseline: "alphabetic",
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    rect() {},
    clip() {},
    arc() {},
    fillText() {},
    strokeText() {},
    setTransform() {},
    resetTransform() {},
    measureText(text: string) {
      return {
        width: text.length * 6
      };
    },
    createLinearGradient() {
      return {
        addColorStop() {}
      };
    }
  };

  return new Proxy(base, {
    get(target, key) {
      const value = target[key as keyof typeof target];
      if (value != null) return value;
      return () => undefined;
    }
  }) as unknown as CanvasRenderingContext2D;
}

/**
 * Generate sample quote data for testing
 */
function generateSampleQuotes(count: number): Quote[] {
  const quotes: Quote[] = [];
  const startDate = new Date("2024-01-01");

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    const basePrice = 100 + i * 0.5;
    quotes.push({
      date,
      open: basePrice,
      high: basePrice + 2,
      low: basePrice - 2,
      close: basePrice + 1,
      volume: 1000000 + i * 10000
    });
  }

  return quotes;
}

/**
 * Generate sample indicator listing for testing
 */
function generateSampleIndicatorListing(): IndicatorListing {
  return {
    name: "Simple Moving Average",
    uiid: "sma-20",
    legendTemplate: "SMA(20)",
    endpoint: "sma",
    category: "moving-average",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [
      {
        displayName: "Lookback periods",
        paramName: "lookbackPeriods",
        dataType: "int",
        defaultValue: 20,
        minimum: 2,
        maximum: 999
      }
    ],
    results: [
      {
        displayName: "SMA",
        tooltipTemplate: "SMA: $VALUE",
        dataName: "sma",
        dataType: "number",
        lineType: "solid",
        stack: "",
        lineWidth: 2,
        defaultColor: "#4169E1",
        order: 1
      }
    ]
  };
}

/**
 * Helper: create a properly mocked HTMLCanvasElement with 2d context.
 */
function createMockCanvas(id: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.id = id;
  canvas.width = 800;
  canvas.height = 400;
  Object.defineProperty(canvas, "getContext", {
    value: (contextType: string) => {
      if (contextType === "2d") {
        return createCanvasContext(canvas);
      }
      return null;
    },
    configurable: true
  });
  Object.defineProperty(canvas, "ownerDocument", {
    value: document,
    writable: false,
    configurable: true
  });
  Object.defineProperty(canvas, "parentNode", {
    value: document.body,
    writable: true,
    configurable: true
  });
  return canvas;
}

/**
 * Smoke Tests for ChartService Critical Paths
 *
 * These tests verify core functionality through ChartManager delegation:
 * 1. Chart initialization (overlay chart with quotes via ChartManager)
 * 2. Indicator lifecycle (add/remove indicator dataset)
 * 3. Theme switching (color changes on theme update)
 * 4. Dataset slicing (bar count changes slice datasets correctly)
 */
describe("ChartService Smoke Tests", () => {
  let service: ChartService;
  let mockApiService: ApiService;
  let mockUserService: UserService;
  let mockWindowService: WindowService;
  let mockUtilityService: UtilityService;
  let resizeSubject: Subject<{ width: number; height: number }>;
  let guidCounter = 0;
  let canvasElement: HTMLCanvasElement;
  let oscillatorsZone: HTMLDivElement;

  /** Typed shortcut: access the private ChartManager for assertions. */
  function getChartManager(): ChartManager {
    return (service as unknown as { chartManager: ChartManager }).chartManager;
  }

  beforeEach(() => {
    // Register Chart.js plugins and financial chart types
    setupIndyCharts();

    guidCounter = 0;
    resizeSubject = new Subject<{ width: number; height: number }>();

    // Mock ApiService
    mockApiService = {
      getQuotes: vi.fn(() => of(generateSampleQuotes(100))),
      getListings: vi.fn(() => of([generateSampleIndicatorListing()])),
      getSelectionData: vi.fn((_selection: IndicatorSelection) => {
        const sampleData: IndicatorDataRow[] = generateSampleQuotes(100).map(q => ({
          date: q.date.toISOString(),
          candle: q,
          sma: q.close * 0.99
        }));
        return of(sampleData);
      })
    } as unknown as ApiService;

    // Mock UserService
    mockUserService = {
      settings: {
        isDarkTheme: false,
        showTooltips: true
      }
    } as UserService;

    // Mock WindowService
    mockWindowService = {
      calculateOptimalBars: vi.fn(() => 50),
      getResizeObservable: vi.fn(() => resizeSubject.asObservable())
    } as unknown as WindowService;

    // Mock UtilityService
    mockUtilityService = {
      guid: vi.fn((prefix: string) => `${prefix}-${guidCounter++}`)
    } as unknown as UtilityService;

    // Mock canvas element and context
    canvasElement = createMockCanvas("chartOverlay");
    document.body.appendChild(canvasElement);

    // Create oscillators zone container
    oscillatorsZone = document.createElement("div");
    oscillatorsZone.id = "oscillators-zone";
    document.body.appendChild(oscillatorsZone);

    // Create service instance by mocking the internal properties directly.
    // This avoids the inject() context requirement.
    service = Object.create(ChartService.prototype);
    (service as any).api = mockApiService;
    (service as any).usr = mockUserService;
    (service as any).util = mockUtilityService;
    (service as any).window = mockWindowService;
    (service as any).destroy$ = new Subject<void>();
    (service as any).loading = { set: vi.fn(), update: vi.fn() };

    // Initialize ChartManager (mirrors constructor logic)
    (service as any).chartManager = new ChartManager({
      settings: { isDarkTheme: false, showTooltips: true }
    });

    service.listings = [];

    // Mock cacheSelections to avoid localStorage side effects
    (service as any).cacheSelections = vi.fn();

    // Subscribe to window resize events
    const resizeObs = mockWindowService.getResizeObservable?.();
    if (resizeObs) {
      resizeObs.pipe().subscribe(dimensions => {
        service.onWindowResize(dimensions);
      });
    }
  });

  afterEach(() => {
    // Complete resize subject first to stop any pending resize callbacks
    resizeSubject.complete();

    // Clean up service (completes destroy$ subject and destroys ChartManager).
    // ChartManager.destroy() is idempotent, so calling it here is safe.
    // The destroy$ subject triggering manager destruction happens BEFORE
    // removing DOM elements to prevent Chart.js MutationObserver errors when
    // the canvas is removed from the DOM.
    service.ngOnDestroy();

    // Remove DOM elements only after chart observers are detached
    if (canvasElement?.parentNode) {
      canvasElement.parentNode.removeChild(canvasElement);
    }
    if (oscillatorsZone?.parentNode) {
      oscillatorsZone.parentNode.removeChild(oscillatorsZone);
    }
  });

  /**
   * Test 1: Chart Initialization
   * Verifies that overlay chart is created with candlestick and volume datasets
   */
  it("should initialize overlay chart with sample quotes", () => {
    const sampleQuotes = generateSampleQuotes(100);
    const mgr = getChartManager();

    // Act: Initialize overlay via ChartManager (same path as loadCharts)
    const ctx = canvasElement.getContext("2d");
    expect(ctx).toBeTruthy();
    mgr.initializeOverlay(ctx as CanvasRenderingContext2D, sampleQuotes, 50);

    // Assert: overlay Chart.js instance exists
    const chart = mgr.overlayChart?.chart;
    expect(chart).toBeDefined();

    // Stub update to avoid JSDOM proxy errors on subsequent calls
    if (chart) chart.update = vi.fn();

    // Assert: Chart has datasets (candlestick + volume)
    const datasets = chart?.data.datasets;
    expect(datasets).toBeDefined();
    expect(datasets?.length).toBeGreaterThanOrEqual(2);
    expect(datasets?.[0]?.type).toBe("candlestick");
    expect(datasets?.[0]?.data.length).toBeGreaterThan(0);
    expect(datasets?.[1]?.type).toBe("bar");
    expect(datasets?.[1]?.data.length).toBeGreaterThan(0);
  });

  /**
   * Test 2: Indicator Lifecycle
   * Verifies adding and removing indicator datasets
   */
  it("should add and remove indicator dataset", async () => {
    const sampleQuotes = generateSampleQuotes(100);
    const mgr = getChartManager();

    // Initialize overlay
    const ctx = canvasElement.getContext("2d");
    expect(ctx).toBeTruthy();
    mgr.initializeOverlay(ctx as CanvasRenderingContext2D, sampleQuotes, 50);

    const chart = mgr.overlayChart?.chart;
    if (chart) chart.update = vi.fn();

    const listing = generateSampleIndicatorListing();
    service.listings = [listing];

    const selection = service.defaultSelection(listing.uiid);

    // Act: Add indicator
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timeout waiting for addSelection")), 2000);
      service.addSelection(selection, listing, false).subscribe({
        next: () => {
          clearTimeout(timeout);
          resolve();
        },
        error: err => {
          clearTimeout(timeout);
          reject(err);
        }
      });
    });

    // Assert: Selection registered in ChartManager
    expect(mgr.selections.length).toBeGreaterThan(0);
    const added = mgr.selections.find(s => s.uiid === listing.uiid);
    expect(added).toBeDefined();
    expect(added?.ucid).toBeTruthy();

    // Assert: service.selections proxies ChartManager
    expect(service.selections.length).toBe(mgr.selections.length);

    // Assert: Dataset added to chart
    const datasetCountAfterAdd = chart?.data.datasets.length;
    expect(datasetCountAfterAdd).toBeGreaterThan(2);

    // Act: Remove indicator
    expect(added).toBeDefined();
    const ucid = (added as IndicatorSelection).ucid;
    service.deleteSelection(ucid);

    // Assert: Selection removed
    expect(mgr.selections.find(s => s.ucid === ucid)).toBeUndefined();
    expect(service.selections.find(s => s.ucid === ucid)).toBeUndefined();

    // Assert: Dataset removed from chart
    const datasetCountAfterRemove = chart?.data.datasets.length;
    expect(datasetCountAfterRemove).toBe(2);
  });

  /**
   * Test 3: Theme Switching
   * Verifies that theme changes produce different chart options.
   *
   * NOTE: Full onSettingsChange() integration test skipped in JSDOM because
   * Chart.js v4 proxy-based option resolution triggers toString errors when
   * financial element defaults contain non-string color objects.
   * The library config functions are tested directly instead.
   */
  it("should produce different chart options for dark vs light theme", async () => {
    const { baseOverlayOptions: overlayOpts } = await import("@facioquo/indy-charts");

    const lightSettings = { isDarkTheme: false, showTooltips: true };
    const darkSettings = { isDarkTheme: true, showTooltips: true };

    const lightOptions = overlayOpts(100000, lightSettings);
    const darkOptions = overlayOpts(100000, darkSettings);

    // Assert: Grid colors differ between themes
    const lightGridColor = (lightOptions.scales?.["y"] as Record<string, unknown>)?.["grid"];
    const darkGridColor = (darkOptions.scales?.["y"] as Record<string, unknown>)?.["grid"];
    expect(lightGridColor).toBeDefined();
    expect(darkGridColor).toBeDefined();
    expect(lightGridColor).not.toEqual(darkGridColor);

    // Assert: Backdrop colors differ
    const lightBackdrop = (lightOptions.scales?.["y"] as Record<string, unknown>)?.["ticks"];
    const darkBackdrop = (darkOptions.scales?.["y"] as Record<string, unknown>)?.["ticks"];
    expect(lightBackdrop).not.toEqual(darkBackdrop);

    // Assert: Chart would receive updated options
    const ctx = canvasElement.getContext("2d");
    expect(ctx).toBeTruthy();
    getChartManager().initializeOverlay(
      ctx as CanvasRenderingContext2D,
      generateSampleQuotes(100),
      50
    );
    expect(getChartManager().overlayChart?.chart).toBeDefined();
  });

  /**
   * Test 4: Dataset Slicing
   * Verifies that ChartManager.setBarCount() correctly slices datasets
   */
  it("should slice datasets correctly on bar count change", () => {
    const sampleQuotes = generateSampleQuotes(100);
    const mgr = getChartManager();

    // Initialize with 50 bars
    const ctx = canvasElement.getContext("2d");
    expect(ctx).toBeTruthy();
    mgr.initializeOverlay(ctx as CanvasRenderingContext2D, sampleQuotes, 50);

    const chart = mgr.overlayChart?.chart;
    expect(chart).toBeDefined();

    const getLen = () => chart?.data.datasets[0]?.data.length ?? 0;

    const initial = getLen();
    expect(initial).toBeGreaterThan(0);

    // Act: Reduce to 30 bars
    mgr.setBarCount(30);
    const after30 = getLen();
    expect(after30).toBeLessThan(initial);
    expect(after30).toBeLessThanOrEqual(30 + 7); // +7 for extra bars

    // Act: Expand to 70 bars
    mgr.setBarCount(70);
    const after70 = getLen();
    expect(after70).toBeGreaterThan(after30);
    expect(after70).toBeLessThanOrEqual(70 + 7);
  });

  /**
   * Test 4b: Window Resize Delegation
   * Verifies that onWindowResize delegates to setBarCount via ChartService
   */
  it("should delegate window resize to optimal bar count", () => {
    const mgr = getChartManager();
    const ctx = canvasElement.getContext("2d");
    expect(ctx).toBeTruthy();
    mgr.initializeOverlay(ctx as CanvasRenderingContext2D, generateSampleQuotes(100), 50);

    mgr.setBarCount(70);
    expect(mgr.currentBarCount).toBe(70);

    (mockWindowService.calculateOptimalBars as any).mockReturnValue(40);
    resizeSubject.next({ width: 800, height: 600 });
    expect(mgr.currentBarCount).toBe(40);
  });
});
