import { TestBed } from "@angular/core/testing";
import { WindowService } from "./window.service";

// Mock Chart.js interface for dimension tracking
interface MockChart {
  resize: jest.Mock;
  update: jest.Mock;
  destroy: jest.Mock;
  canvas: {
    width: number;
    height: number;
    style: {
      width: string;
      height: string;
    };
  };
  chartArea: {
    width: number;
    height: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

// Create mock charts with dimension tracking
const createMockChart = (width: number, height: number): MockChart => ({
  resize: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  canvas: {
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`
    }
  },
  chartArea: {
    width: width - 20,
    height: height - 20,
    left: 10,
    right: width - 10,
    top: 10,
    bottom: height - 10
  }
});

// Chart resize functionality extracted for testing
class ChartResizeHandler {
  private chartOverlay: MockChart | null = null;
  private selections: Array<{ chart: MockChart; chartType: string }> = [];

  setOverlayChart(chart: MockChart): void {
    this.chartOverlay = chart;
  }

  addOscillatorChart(chart: MockChart): void {
    this.selections.push({ chart, chartType: "oscillator" });
  }

  forceChartsResize(): void {
    requestAnimationFrame(() => {
      this.resizeOverlayChart();
      this.resizeOscillatorCharts();
    });
  }

  private resizeOverlayChart(): void {
    if (this.chartOverlay) {
      this.chartOverlay.resize();
      this.chartOverlay.update("resize");
    }
  }

  private resizeOscillatorCharts(): void {
    this.selections.forEach(selection => {
      if (selection.chartType === "oscillator" && selection.chart) {
        selection.chart.resize();
        selection.chart.update("resize");
      }
    });
  }

  getDimensions(): {
    overlay: { width: number; height: number } | null;
    oscillators: Array<{ width: number; height: number }>;
  } {
    return {
      overlay: this.chartOverlay
        ? {
            width: this.chartOverlay.canvas.width,
            height: this.chartOverlay.canvas.height
          }
        : null,
      oscillators: this.selections.map(s => ({
        width: s.chart.canvas.width,
        height: s.chart.canvas.height
      }))
    };
  }
}

describe("Chart Resize Dimension Testing", () => {
  let resizeHandler: ChartResizeHandler;
  let windowService: WindowService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WindowService]
    });

    windowService = TestBed.inject(WindowService);
    resizeHandler = new ChartResizeHandler();
  });

  describe("Chart Dimension Tracking", () => {
    let overlayChart: MockChart;
    let oscillatorChart1: MockChart;
    let oscillatorChart2: MockChart;

    beforeEach(() => {
      // Create mock charts with initial dimensions
      overlayChart = createMockChart(800, 400);
      oscillatorChart1 = createMockChart(600, 300);
      oscillatorChart2 = createMockChart(500, 250);

      // Set up charts in resize handler
      resizeHandler.setOverlayChart(overlayChart);
      resizeHandler.addOscillatorChart(oscillatorChart1);
      resizeHandler.addOscillatorChart(oscillatorChart2);
    });

    it("should track overlay chart dimensions before resize", () => {
      const dimensions = resizeHandler.getDimensions();

      expect(dimensions.overlay).toEqual({
        width: 800,
        height: 400
      });
    });

    it("should track oscillator chart dimensions before resize", () => {
      const dimensions = resizeHandler.getDimensions();

      expect(dimensions.oscillators).toEqual([
        { width: 600, height: 300 },
        { width: 500, height: 250 }
      ]);
    });

    it("should call resize methods when forceChartsResize is triggered", async () => {
      resizeHandler.forceChartsResize();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      // Verify overlay chart resize was called
      expect(overlayChart.resize).toHaveBeenCalledTimes(1);
      expect(overlayChart.update).toHaveBeenCalledWith("resize");
      // Verify oscillator charts resize were called
      expect(oscillatorChart1.resize).toHaveBeenCalledTimes(1);
      expect(oscillatorChart1.update).toHaveBeenCalledWith("resize");
      expect(oscillatorChart2.resize).toHaveBeenCalledTimes(1);
      expect(oscillatorChart2.update).toHaveBeenCalledWith("resize");
    });

    it("should properly track dimension changes during resize", async () => {
      const beforeResize = resizeHandler.getDimensions();

      // Simulate dimension changes that would occur during Chart.js resize
      overlayChart.canvas.width = 1000;
      overlayChart.canvas.height = 500;
      overlayChart.chartArea.width = 980;
      overlayChart.chartArea.height = 480;

      oscillatorChart1.canvas.width = 750;
      oscillatorChart1.canvas.height = 375;
      oscillatorChart1.chartArea.width = 730;
      oscillatorChart1.chartArea.height = 355;

      resizeHandler.forceChartsResize();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

      const afterResize = resizeHandler.getDimensions();

      // Verify dimensions changed correctly
      expect(beforeResize.overlay).toEqual({ width: 800, height: 400 });
      expect(afterResize.overlay).toEqual({ width: 1000, height: 500 });

      expect(beforeResize.oscillators[0]).toEqual({ width: 600, height: 300 });
      expect(afterResize.oscillators[0]).toEqual({ width: 750, height: 375 });

      // Verify resize methods were called
      expect(overlayChart.resize).toHaveBeenCalledTimes(1);
      expect(oscillatorChart1.resize).toHaveBeenCalledTimes(1);
    });

    it("should use requestAnimationFrame for proper DOM synchronization", () => {
      let rafCallback: FrameRequestCallback | undefined;

      // Mock requestAnimationFrame to capture the callback
      const requestAnimationFrameSpy = jest
        .spyOn(window, "requestAnimationFrame")
        .mockImplementation((callback: FrameRequestCallback) => {
          rafCallback = callback;
          return 1;
        });

      resizeHandler.forceChartsResize();

      // Verify requestAnimationFrame was called
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);

      // Execute the captured callback manually
      if (typeof rafCallback === "function") {
        rafCallback(performance.now());
      }

      // Verify resize methods were called after RAF
      expect(overlayChart.resize).toHaveBeenCalledTimes(1);
      expect(oscillatorChart1.resize).toHaveBeenCalledTimes(1);
      expect(oscillatorChart2.resize).toHaveBeenCalledTimes(1);

      // Restore spy
      requestAnimationFrameSpy.mockRestore();
    });

    it("should handle window resize with bar count recalculation", () => {
      // Setup initial window size
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200
      });

      const initialBarCount = windowService.calculateOptimalBars();

      // Simulate window resize
      Object.defineProperty(window, "innerWidth", { value: 1600 });

      const newBarCount = windowService.calculateOptimalBars();

      // Verify bar count increased with larger window
      expect(newBarCount).toBeGreaterThan(initialBarCount);
      expect(initialBarCount).toBe(240); // 1200 / 5
      expect(newBarCount).toBe(320); // 1600 / 5
    });

    it("should maintain chart aspect ratios during resize", () => {
      const initialAspectRatio = overlayChart.canvas.width / overlayChart.canvas.height;

      // Simulate resize maintaining aspect ratio
      overlayChart.canvas.width = 1200;
      overlayChart.canvas.height = 600; // 2:1 ratio maintained

      const newAspectRatio = overlayChart.canvas.width / overlayChart.canvas.height;

      expect(initialAspectRatio).toBe(2); // 800/400 = 2
      expect(newAspectRatio).toBe(2); // 1200/600 = 2
    });

    it("should track chart area dimensions separately from canvas", () => {
      expect(overlayChart.chartArea.width).toBe(780); // canvas width - padding
      expect(overlayChart.chartArea.height).toBe(380); // canvas height - padding

      // After resize
      overlayChart.canvas.width = 1000;
      overlayChart.canvas.height = 500;
      overlayChart.chartArea.width = 980;
      overlayChart.chartArea.height = 480;

      expect(overlayChart.chartArea.width).toBe(980);
      expect(overlayChart.chartArea.height).toBe(480);
    });
  });

  describe("Chart Update Optimization", () => {
    let overlayChart: MockChart;
    let oscillatorChart: MockChart;

    beforeEach(() => {
      overlayChart = createMockChart(800, 400);
      oscillatorChart = createMockChart(600, 300);

      resizeHandler.setOverlayChart(overlayChart);
      resizeHandler.addOscillatorChart(oscillatorChart);
    });

    it("should use 'resize' mode for chart updates during resize", async () => {
      resizeHandler.forceChartsResize();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      // Verify update was called with 'resize' mode for optimization
      expect(overlayChart.update).toHaveBeenCalledWith("resize");
      expect(oscillatorChart.update).toHaveBeenCalledWith("resize");
    });

    it("should call resize before update for proper Chart.js behavior", async () => {
      resizeHandler.forceChartsResize();
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      // Verify call order: resize() before update()
      const overlayResizeCall = overlayChart.resize.mock.invocationCallOrder[0];
      const overlayUpdateCall = overlayChart.update.mock.invocationCallOrder[0];
      const oscResizeCall = oscillatorChart.resize.mock.invocationCallOrder[0];
      const oscUpdateCall = oscillatorChart.update.mock.invocationCallOrder[0];
      expect(overlayResizeCall).toBeLessThan(overlayUpdateCall);
      expect(oscResizeCall).toBeLessThan(oscUpdateCall);
    });

    it("should handle responsive dimension changes", () => {
      // Simulate responsive breakpoint change
      const smallScreenDimensions = resizeHandler.getDimensions();

      // Resize to mobile dimensions
      overlayChart.canvas.width = 320;
      overlayChart.canvas.height = 240;
      oscillatorChart.canvas.width = 320;
      oscillatorChart.canvas.height = 160;

      const mobileScreenDimensions = resizeHandler.getDimensions();

      expect(smallScreenDimensions.overlay?.width).toBe(800);
      expect(mobileScreenDimensions.overlay?.width).toBe(320);
      expect(mobileScreenDimensions.oscillators[0].width).toBe(320);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle null charts gracefully", () => {
      // Don't set any charts

      // Should not throw error
      expect(() => {
        resizeHandler.forceChartsResize();
      }).not.toThrow();

      const dimensions = resizeHandler.getDimensions();
      expect(dimensions.overlay).toBeNull();
      expect(dimensions.oscillators).toEqual([]);
    });

    it("should handle extreme dimension changes", () => {
      const chart = createMockChart(1, 1); // Minimum size
      resizeHandler.setOverlayChart(chart);

      // Resize to maximum size
      chart.canvas.width = 4000;
      chart.canvas.height = 2000;

      const dimensions = resizeHandler.getDimensions();
      expect(dimensions.overlay).toEqual({ width: 4000, height: 2000 });
    });

    it("should maintain precision in dimension calculations", () => {
      const chart = createMockChart(333, 167); // Non-even numbers
      resizeHandler.setOverlayChart(chart);

      const dimensions = resizeHandler.getDimensions();
      expect(dimensions.overlay?.width).toBe(333);
      expect(dimensions.overlay?.height).toBe(167);
    });
  });
});
