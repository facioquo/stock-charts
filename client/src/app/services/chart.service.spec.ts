import "@angular/compiler"; // Required for JIT compilation in tests
import { Chart } from "chart.js";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { of, Subject } from "rxjs";

import { setupIndyCharts } from "@facioquo/indy-charts";
import { ChartService } from "./chart.service";
import { ApiService } from "./api.service";
import { UserService } from "./user.service";
import { UtilityService } from "./utility.service";
import { WindowService } from "./window.service";
import {
  IndicatorListing,
  Quote,
  IndicatorSelection,
  IndicatorDataRow
} from "../pages/chart/chart.models";

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
 * Smoke Tests for ChartService Critical Paths
 *
 * These tests verify core functionality before refactoring:
 * 1. Chart initialization (overlay chart with quotes)
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

  beforeEach(() => {
    // Register Chart.js plugins and financial chart types before tests
    setupIndyCharts();

    // Reset counter for each test
    guidCounter = 0;

    // Create resize subject for WindowService
    resizeSubject = new Subject<{ width: number; height: number }>();

    // Mock ApiService
    mockApiService = {
      getQuotes: vi.fn(() => of(generateSampleQuotes(100))),
      getListings: vi.fn(() => of([generateSampleIndicatorListing()])),
      getSelectionData: vi.fn((_selection: IndicatorSelection) => {
        const sampleData: IndicatorDataRow[] = generateSampleQuotes(100).map(q => ({
          date: q.date.toISOString(),
          candle: q,
          sma: q.close * 0.99 // Mock indicator value
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
    canvasElement = document.createElement("canvas");
    canvasElement.id = "chartOverlay";
    canvasElement.width = 800;
    canvasElement.height = 400;
    Object.defineProperty(canvasElement, "getContext", {
      value: (contextType: string) => {
        if (contextType === "2d") {
          return createCanvasContext(canvasElement);
        }
        return null;
      },
      configurable: true
    });
    // Ensure canvas is properly attached to document for Chart.js
    Object.defineProperty(canvasElement, "ownerDocument", {
      value: document,
      writable: false,
      configurable: true
    });
    Object.defineProperty(canvasElement, "parentNode", {
      value: document.body,
      writable: true,
      configurable: true
    });
    document.body.appendChild(canvasElement);

    // Create oscillators zone container
    oscillatorsZone = document.createElement("div");
    oscillatorsZone.id = "oscillators-zone";
    document.body.appendChild(oscillatorsZone);

    // Create service instance by mocking the internal properties directly
    // This avoids the inject() context requirement
    service = Object.create(ChartService.prototype);
    (service as any).api = mockApiService;
    (service as any).usr = mockUserService;
    (service as any).util = mockUtilityService;
    (service as any).window = mockWindowService;
    (service as any).destroy$ = new Subject<void>();
    service.listings = [];
    service.selections = [];
    (service as any).loading = { set: vi.fn(), update: vi.fn() };
    service.extraBars = 7; // ChartService.EXTRA_BARS
    service.currentBarCount = 50;
    service.allQuotes = [];
    service.allProcessedDatasets = new Map();

    // Mock internal methods that are called but not critical for smoke tests
    (service as any).cacheSelections = vi.fn();
    (service as any).addOverlayLegend = vi.fn();
    (service as any).addOscillatorLegend = vi.fn();
    (service as any).forceChartsResize = vi.fn();

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

    // Destroy charts BEFORE removing DOM elements.
    // Chart.js registers a MutationObserver ("detached" listener) that fires
    // when the canvas is removed from the DOM and tries to call chart.update()
    // on the now-orphaned element, producing unhandled errors.  Destroying the
    // chart first cleanly unregisters all observers/listeners.
    if (service.chartOverlay) {
      service.chartOverlay.destroy();
      (service as any).chartOverlay = undefined;
    }

    // Clean up service (completes destroy$ subject, stops RxJS subscriptions)
    service.ngOnDestroy();

    // Remove DOM elements only after chart observers are detached
    if (canvasElement && canvasElement.parentNode) {
      canvasElement.parentNode.removeChild(canvasElement);
    }
    if (oscillatorsZone && oscillatorsZone.parentNode) {
      oscillatorsZone.parentNode.removeChild(oscillatorsZone);
    }
  });

  /**
   * Test 1: Chart Initialization
   * Verifies that overlay chart is created with candlestick and volume datasets
   */
  it("should initialize overlay chart with sample quotes", () => {
    // Arrange: Quotes are provided by mock ApiService
    const sampleQuotes = generateSampleQuotes(100);

    // Act: Load overlay chart
    service.loadOverlayChart(sampleQuotes.slice(-50));

    // Assert: Chart instance exists
    expect(service.chartOverlay).toBeDefined();
    expect(service.chartOverlay).toBeInstanceOf(Chart);

    // Mock chart.update() to avoid ownerDocument issues in tests
    if (service.chartOverlay) {
      service.chartOverlay.update = vi.fn();
    }

    // Assert: Chart has datasets (candlestick + volume)
    const datasets = service.chartOverlay?.data.datasets;
    expect(datasets).toBeDefined();
    expect(datasets?.length).toBeGreaterThanOrEqual(2);

    // Assert: First dataset is candlestick
    expect(datasets?.[0]?.type).toBe("candlestick");
    expect(datasets?.[0]?.data.length).toBeGreaterThan(0);

    // Assert: Second dataset is volume bars
    expect(datasets?.[1]?.type).toBe("bar");
    expect(datasets?.[1]?.data.length).toBeGreaterThan(0);
  });

  /**
   * Test 2: Indicator Lifecycle
   * Verifies adding and removing indicator datasets
   */
  it("should add and remove indicator dataset", async () => {
    // Arrange: Initialize chart first
    const sampleQuotes = generateSampleQuotes(100);
    service.loadOverlayChart(sampleQuotes.slice(-50));

    // Mock chart.update() to avoid ownerDocument issues
    if (service.chartOverlay) {
      service.chartOverlay.update = vi.fn();
    }

    const listing = generateSampleIndicatorListing();
    service.listings = [listing];

    // Create default selection
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

    // Assert: Selection added to selections array
    expect(service.selections.length).toBeGreaterThan(0);
    const addedSelection = service.selections.find(s => s.uiid === listing.uiid);
    expect(addedSelection).toBeDefined();
    expect(addedSelection?.ucid).toBeDefined();

    // Assert: Dataset added to chart
    const datasetCountAfterAdd = service.chartOverlay?.data.datasets.length;
    expect(datasetCountAfterAdd).toBeGreaterThan(2); // More than candlestick + volume

    // Act: Remove indicator
    const ucidToRemove = addedSelection?.ucid;
    expect(ucidToRemove).toBeTruthy();
    if (!ucidToRemove) throw new Error("ucid must be a non-empty string");
    service.deleteSelection(ucidToRemove);

    // Assert: Selection removed from selections array
    expect(service.selections.find(s => s.ucid === ucidToRemove)).toBeUndefined();

    // Assert: Dataset removed from chart
    const datasetCountAfterRemove = service.chartOverlay?.data.datasets.length;
    expect(datasetCountAfterRemove).toBe(2); // Back to candlestick + volume only
  });

  /**
   * Test 3: Theme Switching
   * Verifies that theme changes produce different chart options.
   *
   * NOTE: Full `onSettingsChange()` integration test is skipped in JSDOM
   * because Chart.js v4 proxy-based option resolution triggers
   * `String.prototype.toString` errors when financial element defaults
   * contain non-string color objects (e.g. `{ up, down, unchanged }`).
   * The library config functions are tested directly instead.
   */
  it("should produce different chart options for dark vs light theme", async () => {
    // Import library config functions directly
    const { baseOverlayOptions: overlayOpts } = await import("@facioquo/indy-charts");

    // Arrange: Define light and dark settings
    const lightSettings = { isDarkTheme: false, showTooltips: true };
    const darkSettings = { isDarkTheme: true, showTooltips: true };

    // Act: Generate options for both themes
    const lightOptions = overlayOpts(100000, lightSettings);
    const darkOptions = overlayOpts(100000, darkSettings);

    // Assert: Grid colors differ between themes
    const lightGridColor = (lightOptions.scales?.y as Record<string, unknown>)?.grid;
    const darkGridColor = (darkOptions.scales?.y as Record<string, unknown>)?.grid;
    expect(lightGridColor).toBeDefined();
    expect(darkGridColor).toBeDefined();
    expect(lightGridColor).not.toEqual(darkGridColor);

    // Assert: Backdrop colors differ between themes
    const lightBackdrop = (lightOptions.scales?.y as Record<string, unknown>)?.ticks;
    const darkBackdrop = (darkOptions.scales?.y as Record<string, unknown>)?.ticks;
    expect(lightBackdrop).not.toEqual(darkBackdrop);

    // Assert: Chart exists and would receive updated options
    const sampleQuotes = generateSampleQuotes(100);
    service.loadOverlayChart(sampleQuotes.slice(-50));
    expect(service.chartOverlay).toBeDefined();
    expect(service.chartOverlay?.options).toBeDefined();
  });

  /**
   * Test 4: Dataset Slicing
   * Verifies that window resize correctly slices datasets based on bar count
   */
  it("should slice datasets correctly on window resize", () => {
    // Arrange: Initialize chart with 100 quotes, display 50 bars
    const sampleQuotes = generateSampleQuotes(100);
    service.allQuotes = sampleQuotes;
    service.currentBarCount = 50;
    service.loadOverlayChart(sampleQuotes.slice(-50));

    const initialDataLength = service.chartOverlay?.data.datasets[0]?.data.length ?? 0;
    expect(initialDataLength).toBeGreaterThan(0);

    // Store full datasets (simulate what happens during indicator loading)
    if (service.chartOverlay) {
      service.allProcessedDatasets.set(
        "overlay-main",
        JSON.parse(JSON.stringify(service.chartOverlay.data.datasets))
      );
    }

    // Act: Trigger resize with smaller bar count (30 bars)
    (mockWindowService.calculateOptimalBars as any).mockReturnValue(30);
    resizeSubject.next({ width: 800, height: 600 });

    // Assert: Bar count updated
    expect(service.currentBarCount).toBe(30);

    // Assert: Dataset was sliced (fewer data points displayed)
    // Note: The actual dataset length should be close to the new bar count
    // (may include extra bars for spacing)
    const newDataLength = service.chartOverlay?.data.datasets[0]?.data.length ?? 0;
    expect(newDataLength).toBeLessThan(initialDataLength);
    expect(newDataLength).toBeLessThanOrEqual(30 + service.extraBars);

    // Act: Trigger resize with larger bar count (70 bars)
    (mockWindowService.calculateOptimalBars as any).mockReturnValue(70);

    resizeSubject.next({ width: 1400, height: 600 });

    // Assert: Bar count updated
    expect(service.currentBarCount).toBe(70);

    // Assert: Dataset was expanded (more data points displayed)
    const expandedDataLength = service.chartOverlay?.data.datasets[0]?.data.length ?? 0;
    expect(expandedDataLength).toBeGreaterThan(newDataLength);
    expect(expandedDataLength).toBeLessThanOrEqual(70 + service.extraBars);
  });
});
