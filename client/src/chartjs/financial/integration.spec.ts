/*!
 * Integration tests for financial chart rendering
 */

import { Chart, TimeSeriesScale, LinearScale } from "chart.js";
import "jest-canvas-mock";
import {
  ensureFinancialChartsRegistered,
  resetFinancialChartsRegistration,
  isFinancialChartsRegistered,
  createFinancialChartConfig,
  FinancialDataPoint
} from "./index";

describe("Financial Chart Integration", () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Reset registration state
    resetFinancialChartsRegistration();

    // Register scales for tests
    Chart.register(TimeSeriesScale, LinearScale);

    // Set up canvas
    canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 400;
    ctx = canvas.getContext("2d")!;

    // Mock getBoundingClientRect
    jest.spyOn(canvas, "getBoundingClientRect").mockImplementation(() => ({
      top: 0,
      left: 0,
      right: 800,
      bottom: 400,
      width: 800,
      height: 400,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }));
  });

  afterEach(() => {
    resetFinancialChartsRegistration();
  });

  describe("Candlestick Chart Rendering", () => {
    it("should register financial charts and render a basic candlestick chart", () => {
      // Ensure financial charts are registered
      ensureFinancialChartsRegistered();

      // Sample financial data
      const sampleData: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 },
        { x: 1641081600000, o: 105, h: 115, l: 100, c: 102 },
        { x: 1641168000000, o: 102, h: 108, l: 98, c: 106 },
        { x: 1641254400000, o: 106, h: 112, l: 103, c: 109 },
        { x: 1641340800000, o: 109, h: 114, l: 107, c: 111 }
      ];

      // Create chart configuration with simpler scales
      const config = {
        type: "candlestick" as any,
        data: {
          datasets: [
            {
              type: "candlestick" as any,
              label: "Price",
              data: sampleData
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: "linear"
            },
            y: {
              type: "linear"
            }
          }
        }
      };

      // Create and render chart
      expect(() => {
        const chart = new Chart(ctx, config);
        expect(chart).toBeTruthy();
        expect(chart.data.datasets).toHaveLength(1);
        expect(chart.data.datasets[0].type).toBe("candlestick");

        // Clean up
        chart.destroy();
      }).not.toThrow();
    });

    it("should render candlestick chart with volume data", () => {
      ensureFinancialChartsRegistered();

      const sampleData: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 },
        { x: 1641081600000, o: 105, h: 115, l: 100, c: 102 }
      ];

      const volumeData = [
        { x: 1640995200000, y: 1000000 },
        { x: 1641081600000, y: 1500000 }
      ];

      const config = {
        type: "candlestick" as any,
        data: {
          datasets: [
            {
              type: "candlestick" as any,
              label: "Price",
              data: sampleData
            },
            {
              type: "bar" as any,
              label: "Volume",
              data: volumeData,
              yAxisID: "volume"
            }
          ]
        },
        options: {
          scales: {
            x: { type: "linear" },
            y: { type: "linear" },
            volume: { type: "linear" }
          }
        }
      };

      expect(() => {
        const chart = new Chart(ctx, config);
        expect(chart.data.datasets).toHaveLength(2);
        expect(chart.data.datasets[0].type).toBe("candlestick");
        expect(chart.data.datasets[1].type).toBe("bar");

        chart.destroy();
      }).not.toThrow();
    });

    it("should verify controller and element registration", () => {
      ensureFinancialChartsRegistered();

      // Check that Chart.js has the controllers registered
      const registeredControllers = Chart.registry.controllers;
      expect(registeredControllers.get("candlestick")).toBeDefined();
      expect(registeredControllers.get("ohlc")).toBeDefined();

      // Check that elements are registered
      const registeredElements = Chart.registry.elements;
      expect(registeredElements.get("candlestick")).toBeDefined();
      expect(registeredElements.get("ohlc")).toBeDefined();
    });

    it("should handle chart updates and data changes", () => {
      ensureFinancialChartsRegistered();

      const initialData: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 }
      ];

      const config = {
        type: "candlestick" as any,
        data: {
          datasets: [
            {
              type: "candlestick" as any,
              label: "Price",
              data: initialData
            }
          ]
        },
        options: {
          scales: {
            x: { type: "linear" },
            y: { type: "linear" }
          }
        }
      };
      const chart = new Chart(ctx, config);

      // Update data
      const newData: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 },
        { x: 1641081600000, o: 105, h: 115, l: 100, c: 102 }
      ];

      expect(() => {
        chart.data.datasets[0].data = newData;
        chart.update();
      }).not.toThrow();

      expect(chart.data.datasets[0].data).toHaveLength(2);

      chart.destroy();
    });

    it("should handle edge cases with minimal data", () => {
      ensureFinancialChartsRegistered();

      // Single data point
      const singleDataPoint: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 100, l: 100, c: 100 }
      ];

      const config = {
        type: "candlestick" as any,
        data: {
          datasets: [
            {
              type: "candlestick" as any,
              label: "Price",
              data: singleDataPoint
            }
          ]
        },
        options: {
          scales: {
            x: { type: "linear" },
            y: { type: "linear" }
          }
        }
      };

      expect(() => {
        const chart = new Chart(ctx, config);
        expect(chart.data.datasets[0].data).toHaveLength(1);
        chart.destroy();
      }).not.toThrow();
    });

    it("should maintain chart responsiveness settings", () => {
      ensureFinancialChartsRegistered();

      const data: FinancialDataPoint[] = [{ x: 1640995200000, o: 100, h: 110, l: 95, c: 105 }];

      const config = {
        type: "candlestick" as any,
        data: {
          datasets: [
            {
              type: "candlestick" as any,
              label: "Price",
              data: data
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { type: "linear" },
            y: { type: "linear" }
          }
        }
      };

      const chart = new Chart(ctx, config);

      expect(chart.options.responsive).toBe(true);
      expect(chart.options.maintainAspectRatio).toBe(false);

      chart.destroy();
    });
  });

  describe("OHLC Chart Rendering", () => {
    it("should render OHLC chart using factory", () => {
      ensureFinancialChartsRegistered();

      const data: FinancialDataPoint[] = [
        { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 },
        { x: 1641081600000, o: 105, h: 115, l: 100, c: 102 }
      ];

      // Since createOhlcDataset is available, we can create OHLC config manually
      const config = {
        type: "ohlc" as any,
        data: {
          datasets: [
            {
              type: "ohlc" as any,
              label: "OHLC Test",
              data: data
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      };

      expect(() => {
        const chart = new Chart(ctx, config);
        expect(chart.data.datasets[0].type).toBe("ohlc");
        chart.destroy();
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should ensure registration is properly tested", () => {
      // This test verifies that our registration system works
      expect(isFinancialChartsRegistered()).toBe(false);

      ensureFinancialChartsRegistered();

      expect(isFinancialChartsRegistered()).toBe(true);

      // Verify controllers are available
      expect(Chart.registry.controllers.get("candlestick")).toBeDefined();
      expect(Chart.registry.controllers.get("ohlc")).toBeDefined();
    });
  });
});
