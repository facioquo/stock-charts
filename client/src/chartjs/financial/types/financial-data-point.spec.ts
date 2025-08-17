/**
 * Unit tests for financial data point types
 */

import { FinancialDataPoint, FinancialParsedData } from "./financial-data-point";

describe("Financial Data Point Types", () => {
  describe("FinancialDataPoint", () => {
    it("should have correct structure for valid OHLC data", () => {
      const dataPoint: FinancialDataPoint = {
        x: 1641024000000, // timestamp
        o: 100.50,        // open
        h: 102.75,        // high
        l: 99.25,         // low
        c: 101.25         // close
      };

      expect(typeof dataPoint.x).toBe("number");
      expect(typeof dataPoint.o).toBe("number");
      expect(typeof dataPoint.h).toBe("number");
      expect(typeof dataPoint.l).toBe("number");
      expect(typeof dataPoint.c).toBe("number");
    });

    it("should work with integer values", () => {
      const dataPoint: FinancialDataPoint = {
        x: 1,
        o: 100,
        h: 110,
        l: 95,
        c: 105
      };

      expect(dataPoint.x).toBe(1);
      expect(dataPoint.o).toBe(100);
      expect(dataPoint.h).toBe(110);
      expect(dataPoint.l).toBe(95);
      expect(dataPoint.c).toBe(105);
    });

    it("should work with decimal values", () => {
      const dataPoint: FinancialDataPoint = {
        x: 1641024000000,
        o: 100.123,
        h: 102.789,
        l: 99.456,
        c: 101.654
      };

      expect(dataPoint.o).toBeCloseTo(100.123, 3);
      expect(dataPoint.h).toBeCloseTo(102.789, 3);
      expect(dataPoint.l).toBeCloseTo(99.456, 3);
      expect(dataPoint.c).toBeCloseTo(101.654, 3);
    });

    it("should validate logical OHLC relationships", () => {
      // Note: This is a test of expected data relationships, not enforced by the type
      const validDataPoint: FinancialDataPoint = {
        x: 1,
        o: 100,
        h: 110, // high should be >= max(open, close)
        l: 95,  // low should be <= min(open, close)
        c: 105
      };

      // High should be >= open and close
      expect(validDataPoint.h).toBeGreaterThanOrEqual(validDataPoint.o);
      expect(validDataPoint.h).toBeGreaterThanOrEqual(validDataPoint.c);

      // Low should be <= open and close
      expect(validDataPoint.l).toBeLessThanOrEqual(validDataPoint.o);
      expect(validDataPoint.l).toBeLessThanOrEqual(validDataPoint.c);
    });

    it("should handle edge case where all OHLC values are equal", () => {
      const flatDataPoint: FinancialDataPoint = {
        x: 1,
        o: 100,
        h: 100,
        l: 100,
        c: 100
      };

      expect(flatDataPoint.o).toBe(flatDataPoint.h);
      expect(flatDataPoint.h).toBe(flatDataPoint.l);
      expect(flatDataPoint.l).toBe(flatDataPoint.c);
    });
  });

  describe("FinancialParsedData", () => {
    it("should allow undefined _custom property", () => {
      const parsedData: FinancialParsedData = {};
      expect(parsedData._custom).toBeUndefined();
    });

    it("should allow any value for _custom property", () => {
      const parsedDataWithCustom: FinancialParsedData = {
        _custom: { someProperty: "value" }
      };

      expect(parsedDataWithCustom._custom).toBeDefined();
      expect((parsedDataWithCustom._custom as any).someProperty).toBe("value");
    });

    it("should work with null _custom property", () => {
      const parsedDataWithNull: FinancialParsedData = {
        _custom: null
      };

      expect(parsedDataWithNull._custom).toBeNull();
    });
  });

  describe("Sample data creation", () => {
    it("should create sample dataset for testing", () => {
      const sampleData: FinancialDataPoint[] = [
        { x: 1, o: 100, h: 105, l: 98, c: 103 },
        { x: 2, o: 103, h: 108, l: 101, c: 106 },
        { x: 3, o: 106, h: 107, l: 104, c: 105 }
      ];

      expect(sampleData).toHaveLength(3);
      expect(sampleData[0].x).toBe(1);
      expect(sampleData[1].c).toBe(106);
      expect(sampleData[2].l).toBe(104);
    });

    it("should handle time-based x values", () => {
      const now = Date.now();
      const timeBasedData: FinancialDataPoint[] = [
        { x: now, o: 100, h: 105, l: 98, c: 103 },
        { x: now + 86400000, o: 103, h: 108, l: 101, c: 106 }, // +1 day
        { x: now + 172800000, o: 106, h: 107, l: 104, c: 105 } // +2 days
      ];

      expect(timeBasedData[0].x).toBe(now);
      expect(timeBasedData[1].x).toBe(now + 86400000);
      expect(timeBasedData[2].x).toBe(now + 172800000);
    });
  });
});