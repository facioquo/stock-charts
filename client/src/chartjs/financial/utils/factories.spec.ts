/*!
 * Unit tests for financial chart factory utilities
 */

import {
  createCandlestickDataset,
  createVolumeDataset,
  createOhlcDataset,
  createFinancialChartConfig,
  convertToFinancialDataPoints,
  convertToVolumeDataPoints
} from "../utils/factories";
import { DEFAULT_FINANCIAL_COLORS } from "../utils/colors";

describe("Financial Chart Factories", () => {
  const sampleFinancialData = [
    { x: 1640995200000, o: 100, h: 110, l: 95, c: 105 },
    { x: 1641081600000, o: 105, h: 115, l: 100, c: 102 },
    { x: 1641168000000, o: 102, h: 108, l: 98, c: 106 }
  ];

  const sampleVolumeData = [
    { x: 1640995200000, y: 1000000 },
    { x: 1641081600000, y: 1500000 },
    { x: 1641168000000, y: 800000 }
  ];

  describe("createCandlestickDataset", () => {
    it("should create a candlestick dataset with default options", () => {
      const dataset = createCandlestickDataset({
        data: sampleFinancialData
      });

      expect(dataset.type).toBe("candlestick");
      expect(dataset.label).toBe("Price");
      expect(dataset.data).toBe(sampleFinancialData);
      expect(dataset.borderWidth).toBe(1);
    });

    it("should use provided label and options", () => {
      const dataset = createCandlestickDataset({
        label: "Custom Stock Price",
        data: sampleFinancialData,
        borderWidth: 2
      });

      expect(dataset.label).toBe("Custom Stock Price");
      expect(dataset.borderWidth).toBe(2);
    });

    it("should use custom color scheme when provided", () => {
      const customColors = {
        up: "#00FF00",
        down: "#FF0000",
        unchanged: "#808080"
      };

      const dataset = createCandlestickDataset({
        data: sampleFinancialData,
        colorScheme: customColors
      });

      expect((dataset as any).color).toBe(customColors);
      expect((dataset as any).borderColor).toBe(customColors);
    });
  });

  describe("createVolumeDataset", () => {
    it("should create a volume dataset with default options", () => {
      const dataset = createVolumeDataset({
        data: sampleVolumeData
      });

      expect(dataset.type).toBe("bar");
      expect(dataset.label).toBe("Volume");
      expect(dataset.data).toBe(sampleVolumeData);
      expect((dataset as any).yAxisID).toBe("volume");
      expect(dataset.borderWidth).toBe(0);
    });

    it("should use provided label and yAxisID", () => {
      const dataset = createVolumeDataset({
        label: "Trading Volume",
        data: sampleVolumeData,
        yAxisID: "vol"
      });

      expect(dataset.label).toBe("Trading Volume");
      expect((dataset as any).yAxisID).toBe("vol");
    });

    it("should generate colors based on OHLC data", () => {
      const volumeDataWithOHLC = [
        { x: 1640995200000, y: 1000000, o: 100, c: 105 }, // up
        { x: 1641081600000, y: 1500000, o: 105, c: 100 }, // down
        { x: 1641168000000, y: 800000, o: 102, c: 102 } // unchanged
      ];

      const dataset = createVolumeDataset({
        data: volumeDataWithOHLC
      });

      expect(Array.isArray(dataset.backgroundColor)).toBe(true);
      expect((dataset.backgroundColor as string[]).length).toBe(3);
    });
  });

  describe("createOhlcDataset", () => {
    it("should create an OHLC dataset with default options", () => {
      const dataset = createOhlcDataset({
        data: sampleFinancialData
      });

      expect(dataset.type).toBe("ohlc");
      expect(dataset.label).toBe("OHLC");
      expect(dataset.data).toBe(sampleFinancialData);
      expect((dataset as any).lineWidth).toBe(2);
      expect((dataset as any).armLengthRatio).toBe(0.8);
    });

    it("should use provided label and lineWidth", () => {
      const dataset = createOhlcDataset({
        label: "Stock OHLC",
        data: sampleFinancialData,
        borderWidth: 3
      });

      expect(dataset.label).toBe("Stock OHLC");
      expect((dataset as any).lineWidth).toBe(3);
    });
  });

  describe("createFinancialChartConfig", () => {
    it("should create a chart config with candlestick data only", () => {
      const config = createFinancialChartConfig(sampleFinancialData);

      expect(config.type).toBe("candlestick");
      expect(config.data.datasets).toHaveLength(1);
      expect(config.data.datasets[0].type).toBe("candlestick");
    });

    it("should create a chart config with candlestick and volume data", () => {
      const config = createFinancialChartConfig(sampleFinancialData, sampleVolumeData);

      expect(config.data.datasets).toHaveLength(2);
      expect(config.data.datasets[0].type).toBe("candlestick");
      expect(config.data.datasets[1].type).toBe("bar");
    });

    it("should set up scales correctly", () => {
      const config = createFinancialChartConfig(sampleFinancialData, sampleVolumeData);

      expect(config.options?.scales?.x?.type).toBe("timeseries");
      expect(config.options?.scales?.y?.type).toBe("linear");
      expect((config.options?.scales?.y as any)?.position).toBe("right");
      expect(config.options?.scales?.volume).toBeDefined();
    });

    it("should use custom options when provided", () => {
      const customOptions = {
        responsive: false,
        volumeAxisSize: 30,
        scales: {
          x: {
            display: false
          }
        }
      };

      const config = createFinancialChartConfig(
        sampleFinancialData,
        sampleVolumeData,
        customOptions
      );

      expect(config.options?.responsive).toBe(false);
      expect(config.options?.scales?.x?.display).toBe(false);
    });
  });

  describe("convertToFinancialDataPoints", () => {
    it("should convert quote data to financial data points", () => {
      const quotes = [
        { date: "2022-01-01", open: 100, high: 110, low: 95, close: 105 },
        { date: new Date("2022-01-02"), open: 105, high: 115, low: 100, close: 102 }
      ];

      const dataPoints = convertToFinancialDataPoints(quotes);

      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0].x).toBe(new Date("2022-01-01").getTime());
      expect(dataPoints[0].o).toBe(100);
      expect(dataPoints[0].h).toBe(110);
      expect(dataPoints[0].l).toBe(95);
      expect(dataPoints[0].c).toBe(105);

      expect(dataPoints[1].x).toBe(new Date("2022-01-02").getTime());
      expect(dataPoints[1].o).toBe(105);
    });

    it("should handle empty array", () => {
      const dataPoints = convertToFinancialDataPoints([]);
      expect(dataPoints).toHaveLength(0);
    });
  });

  describe("convertToVolumeDataPoints", () => {
    it("should convert quote data to volume data points", () => {
      const quotes = [
        { date: "2022-01-01", volume: 1000000 },
        { date: new Date("2022-01-02"), volume: 1500000 }
      ];

      const dataPoints = convertToVolumeDataPoints(quotes);

      expect(dataPoints).toHaveLength(2);
      expect(dataPoints[0].x).toBe(new Date("2022-01-01").getTime());
      expect(dataPoints[0].y).toBe(1000000);

      expect(dataPoints[1].x).toBe(new Date("2022-01-02").getTime());
      expect(dataPoints[1].y).toBe(1500000);
    });

    it("should handle empty array", () => {
      const dataPoints = convertToVolumeDataPoints([]);
      expect(dataPoints).toHaveLength(0);
    });
  });
});
