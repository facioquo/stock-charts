/**
 * Unit tests for financial chart factory utilities
 */

import {
  createCandlestickDataset,
  createVolumeDataset,
  createFinancialChartOptions,
  createLargeDatasetChartOptions,
  CandlestickDatasetOptions,
  VolumeDatasetOptions
} from "./factories";
import { FinancialDataPoint } from "./types/financial-data-point";
import { FINANCIAL_COLORS } from "./colors";

describe("Financial Chart Factories", () => {
  describe("createCandlestickDataset", () => {
    const sampleData: FinancialDataPoint[] = [
      { x: 1, o: 100, h: 110, l: 95, c: 105 },
      { x: 2, o: 105, h: 115, l: 100, c: 110 },
      { x: 3, o: 110, h: 112, l: 108, c: 109 }
    ];

    it("should create a candlestick dataset with default options", () => {
      const options: CandlestickDatasetOptions = {
        data: sampleData
      };

      const dataset = createCandlestickDataset(options);

      expect(dataset.type).toBe("candlestick");
      expect(dataset.label).toBe("Price");
      expect(dataset.data).toBe(sampleData);
      expect(dataset.borderWidth).toBe(1);
      expect(dataset.color).toBeDefined();
    });

    it("should create a candlestick dataset with custom options", () => {
      const customColors = {
        up: "#00FF00",
        down: "#FF0000",
        unchanged: "#808080"
      };

      const options: CandlestickDatasetOptions = {
        label: "Custom Price Data",
        data: sampleData,
        colors: customColors,
        borderWidth: 2
      };

      const dataset = createCandlestickDataset(options);

      expect(dataset.type).toBe("candlestick");
      expect(dataset.label).toBe("Custom Price Data");
      expect(dataset.data).toBe(sampleData);
      expect(dataset.borderWidth).toBe(2);
      expect(dataset.color).toBe(customColors);
    });

    it("should use default colors when not provided", () => {
      const options: CandlestickDatasetOptions = {
        data: sampleData
      };

      const dataset = createCandlestickDataset(options);

      expect(dataset.color.up).toBe(FINANCIAL_COLORS.UP);
      expect(dataset.color.down).toBe(FINANCIAL_COLORS.DOWN);
      expect(dataset.color.unchanged).toBe(FINANCIAL_COLORS.UNCHANGED);
    });
  });

  describe("createVolumeDataset", () => {
    const sampleVolumeData = [
      { x: 1, y: 1000 },
      { x: 2, y: 1500 },
      { x: 3, y: 800 }
    ];

    const sampleOhlcData: FinancialDataPoint[] = [
      { x: 1, o: 100, h: 110, l: 95, c: 105 }, // up
      { x: 2, o: 105, h: 115, l: 100, c: 100 }, // down  
      { x: 3, o: 100, h: 112, l: 98, c: 100 }   // unchanged
    ];

    it("should create a volume dataset with default styling", () => {
      const options: VolumeDatasetOptions = {
        data: sampleVolumeData
      };

      const dataset = createVolumeDataset(options);

      expect(dataset.type).toBe("bar");
      expect(dataset.label).toBe("Volume");
      expect(dataset.data).toBe(sampleVolumeData);
      expect(dataset.borderWidth).toBe(0);
    });

    it("should create a volume dataset with custom label", () => {
      const options: VolumeDatasetOptions = {
        label: "Trading Volume",
        data: sampleVolumeData
      };

      const dataset = createVolumeDataset(options);

      expect(dataset.label).toBe("Trading Volume");
    });

    it("should create dynamic background colors based on OHLC data", () => {
      const options: VolumeDatasetOptions = {
        data: sampleVolumeData,
        ohlcData: sampleOhlcData
      };

      const dataset = createVolumeDataset(options);

      expect(typeof dataset.backgroundColor).toBe("function");
      
      // Test the color callback
      const colorCallback = dataset.backgroundColor as any;
      
      // Up case (close > open)
      expect(colorCallback({ dataIndex: 0 })).toContain(FINANCIAL_COLORS.UP);
      
      // Down case (close < open) 
      expect(colorCallback({ dataIndex: 1 })).toContain(FINANCIAL_COLORS.DOWN);
      
      // Unchanged case (close = open)
      expect(colorCallback({ dataIndex: 2 })).toContain(FINANCIAL_COLORS.UNCHANGED);
    });

    it("should handle missing OHLC data gracefully", () => {
      const options: VolumeDatasetOptions = {
        data: sampleVolumeData,
        ohlcData: sampleOhlcData
      };

      const dataset = createVolumeDataset(options);
      const colorCallback = dataset.backgroundColor as any;
      
      // Test with invalid index
      expect(colorCallback({ dataIndex: 999 })).toContain(FINANCIAL_COLORS.UNCHANGED);
    });
  });

  describe("createFinancialChartOptions", () => {
    it("should create base financial chart options", () => {
      const options = createFinancialChartOptions();

      expect(options).toBeDefined();
      expect(options!.responsive).toBe(true);
      expect(options!.maintainAspectRatio).toBe(false);
    });

    it("should configure interaction settings", () => {
      const options = createFinancialChartOptions();

      expect(options!.interaction).toBeDefined();
      expect(options!.interaction?.intersect).toBe(false);
      expect(options!.interaction?.mode).toBe("index");
    });

    it("should configure basic scales", () => {
      const options = createFinancialChartOptions();

      expect(options!.scales).toBeDefined();
      expect(options!.scales?.x).toBeDefined();
      expect(options!.scales?.y).toBeDefined();
    });

    it("should configure tooltip settings", () => {
      const options = createFinancialChartOptions();

      expect(options!.plugins?.tooltip).toBeDefined();
      expect(options!.plugins?.tooltip?.intersect).toBe(false);
      expect(options!.plugins?.tooltip?.mode).toBe("index");
      expect(options!.plugins?.tooltip?.callbacks?.label).toBeDefined();
    });
  });

  describe("createLargeDatasetChartOptions", () => {
    it("should create optimized options for large datasets", () => {
      const options = createLargeDatasetChartOptions();

      expect(options).toBeDefined();
      expect(options!.animation).toBe(false);
      expect(options!.parsing).toBe(false);
    });

    it("should configure performance optimizations", () => {
      const options = createLargeDatasetChartOptions();

      expect(options!.elements?.point?.radius).toBe(0);
      expect(options!.elements?.point?.hoverRadius).toBe(0);
    });

    it("should inherit base properties", () => {
      const options = createLargeDatasetChartOptions();

      // Should still have base financial chart properties
      expect(options!.responsive).toBe(true);
      expect(options!.maintainAspectRatio).toBe(false);
    });
  });
});