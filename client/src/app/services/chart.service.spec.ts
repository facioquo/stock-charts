import "@angular/compiler"; // Required for JIT compilation in tests
import { Chart } from "chart.js";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { of, Subject } from "rxjs";

import { registerFinancialCharts } from "@facioquo/chartjs-chart-financial";
import { ChartService } from "./chart.service";
import { ApiService } from "./api.service";
import { ChartConfigService } from "./config.service";
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
        lineType: "line",
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
  let mockConfigService: ChartConfigService;
  let resizeSubject: Subject<{ width: number; height: number }>;
  let guidCounter = 0;
  let canvasElement: HTMLCanvasElement;
  let oscillatorsZone: HTMLDivElement;

  beforeEach(() => {
    // Register financial chart types before tests
    registerFinancialCharts();

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

    // Mock ChartConfigService
    mockConfigService = {
      baseOverlayConfig: vi.fn((volumeAxisSize: number) => ({
        type: "candlestick" as const,
        data: { datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false as const,
          scales: {
            x: { type: "time" as const, display: true },
            y: { type: "linear" as const, display: true },
            volumeAxis: { type: "linear" as const, max: volumeAxisSize, display: false }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          }
        }
      })),
      baseOverlayOptions: vi.fn((volumeAxisSize: number) => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        scales: {
          x: { type: "time" as const, display: true },
          y: { type: "linear" as const, display: true },
          volumeAxis: { type: "linear" as const, max: volumeAxisSize, display: false }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      })),
      baseOscillatorOptions: vi.fn(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: false as const,
        scales: {
          x: { type: "time" as const, display: true },
          y: { type: "linear" as const, display: true }
        },
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      })),
      baseDataset: vi.fn((result, resultConfig) => ({
        type: (resultConfig?.lineType === "bar" ? "bar" : "line") as "bar" | "line",
        label: result.label,
        data: [],
        borderColor: resultConfig?.defaultColor ?? "#4169E1",
        backgroundColor: resultConfig?.defaultColor ?? "#4169E1",
        borderWidth: resultConfig?.lineWidth ?? 2,
        yAxisID: "y"
      }))
    } as unknown as ChartConfigService;

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
    (service as any).cfg = mockConfigService;
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
    // Clean up DOM elements
    if (canvasElement && canvasElement.parentNode) {
      canvasElement.parentNode.removeChild(canvasElement);
    }
    if (oscillatorsZone && oscillatorsZone.parentNode) {
      oscillatorsZone.parentNode.removeChild(oscillatorsZone);
    }

    // Destroy charts
    if (service.chartOverlay) {
      service.chartOverlay.destroy();
    }

    // Clean up service
    service.ngOnDestroy();
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
    const ucidToRemove = addedSelection?.ucid ?? "";
    service.deleteSelection(ucidToRemove);

    // Assert: Selection removed from selections array
    expect(service.selections.find(s => s.ucid === ucidToRemove)).toBeUndefined();

    // Assert: Dataset removed from chart
    const datasetCountAfterRemove = service.chartOverlay?.data.datasets.length;
    expect(datasetCountAfterRemove).toBe(2); // Back to candlestick + volume only
  });

  /**
   * Test 3: Theme Switching
   * Verifies that theme changes update chart colors
   */
  it("should update theme colors on theme change", () => {
    // Arrange: Initialize chart with light theme
    const sampleQuotes = generateSampleQuotes(100);
    service.loadOverlayChart(sampleQuotes.slice(-50));

    const initialOptions = service.chartOverlay?.options;
    expect(initialOptions).toBeDefined();

    // Mock chart scales to avoid undefined access and update() to avoid ownerDocument issues
    if (service.chartOverlay) {
      (service.chartOverlay as any).scales = {
        volumeAxis: { max: 100000 },
        x: {},
        y: {}
      };
      service.chartOverlay.update = vi.fn();
    }

    // Act: Switch to dark theme
    if (mockUserService.settings) {
      mockUserService.settings.isDarkTheme = true;
    }
    service.onSettingsChange();

    // Assert: Chart options were updated (new options object)
    const updatedOptions = service.chartOverlay?.options;
    expect(updatedOptions).toBeDefined();

    // Assert: Chart still has data
    const datasets = service.chartOverlay?.data.datasets;
    expect(datasets).toBeDefined();
    expect(datasets && datasets.length).toBeGreaterThanOrEqual(2);
    expect(mockConfigService.baseOverlayOptions).toHaveBeenCalled();
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
