/**
 * Integration test for financial chart rendering
 */

import { Chart } from "chart.js";
import {
  ensureFinancialChartsRegistered,
  resetRegistrationState,
  createCandlestickDataset,
  createFinancialChartOptions,
  FinancialDataPoint
} from "./index";

// Mock canvas for Chart.js
const mockCanvas = document.createElement("canvas");
mockCanvas.width = 400;
mockCanvas.height = 200;

describe("Financial Chart Integration", () => {
  beforeEach(() => {
    resetRegistrationState();
    ensureFinancialChartsRegistered();
  });

  afterEach(() => {
    resetRegistrationState();
  });

  it("should create a candlestick chart without errors", () => {
    const sampleData: FinancialDataPoint[] = [
      { x: 1, o: 100, h: 110, l: 95, c: 105 },
      { x: 2, o: 105, h: 115, l: 100, c: 110 },
      { x: 3, o: 110, h: 112, l: 108, c: 109 }
    ];

    const dataset = createCandlestickDataset({
      label: "Test Stock",
      data: sampleData
    });

    const options = createFinancialChartOptions();

    expect(() => {
      new Chart(mockCanvas, {
        type: "candlestick" as any,
        data: {
          datasets: [dataset]
        },
        options
      });
    }).not.toThrow();
  });

  it("should create a chart with proper dataset configuration", () => {
    const sampleData: FinancialDataPoint[] = [
      { x: 1, o: 100, h: 110, l: 95, c: 105 }
    ];

    const dataset = createCandlestickDataset({
      label: "Integration Test",
      data: sampleData
    });

    expect(dataset.type).toBe("candlestick");
    expect(dataset.label).toBe("Integration Test");
    expect(dataset.data).toHaveLength(1);
    expect(dataset.data[0]).toEqual(sampleData[0]);
  });

  it("should register financial chart components", () => {
    // Verify that Chart.js has registered financial components
    const registry = Chart.registry;
    
    // Check if controllers are registered
    expect(registry.getController("candlestick")).toBeDefined();
    expect(registry.getController("ohlc")).toBeDefined();
    
    // Check if elements are registered
    expect(registry.getElement("candlestick")).toBeDefined();
    expect(registry.getElement("ohlc")).toBeDefined();
  });

  it("should handle chart configuration with financial data", () => {
    const sampleData: FinancialDataPoint[] = [
      { x: Date.now(), o: 100.50, h: 102.75, l: 99.25, c: 101.25 },
      { x: Date.now() + 86400000, o: 101.25, h: 103.00, l: 100.50, c: 102.50 }
    ];

    const dataset = createCandlestickDataset({
      data: sampleData,
      borderWidth: 2
    });

    const chart = new Chart(mockCanvas, {
      type: "candlestick" as any,
      data: {
        datasets: [dataset]
      },
      options: createFinancialChartOptions()
    });

    expect(chart).toBeDefined();
    expect(chart.data.datasets).toHaveLength(1);
    expect(chart.data.datasets[0].data).toHaveLength(2);

    // Clean up
    chart.destroy();
  });

  it("should work with empty dataset", () => {
    const dataset = createCandlestickDataset({
      data: []
    });

    expect(() => {
      const chart = new Chart(mockCanvas, {
        type: "candlestick" as any,
        data: {
          datasets: [dataset]
        },
        options: createFinancialChartOptions()
      });
      chart.destroy();
    }).not.toThrow();
  });
});