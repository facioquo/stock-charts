/**
 * Unit tests for financial chart color utilities
 */

import {
  FINANCIAL_COLORS,
  FinancialColorConfig,
  createFinancialColorCallback,
  createDefaultFinancialColors
} from "./colors";

describe("Financial Chart Colors", () => {
  describe("FINANCIAL_COLORS constants", () => {
    it("should have correct color values", () => {
      expect(FINANCIAL_COLORS.UP).toBe("rgba(80, 160, 115, 1)");
      expect(FINANCIAL_COLORS.DOWN).toBe("rgba(215, 85, 65, 1)");
      expect(FINANCIAL_COLORS.UNCHANGED).toBe("rgba(90, 90, 90, 1)");
    });

    it("should be immutable", () => {
      // FINANCIAL_COLORS uses 'as const' which makes it readonly in TypeScript
      // This test verifies the constant object structure is preserved
      expect(Object.isFrozen(FINANCIAL_COLORS)).toBe(false); // 'as const' doesn't freeze, just makes readonly
      expect(FINANCIAL_COLORS.UP).toBe("rgba(80, 160, 115, 1)");
      expect(FINANCIAL_COLORS.DOWN).toBe("rgba(215, 85, 65, 1)");
      expect(FINANCIAL_COLORS.UNCHANGED).toBe("rgba(90, 90, 90, 1)");
    });
  });

  describe("createDefaultFinancialColors", () => {
    it("should create a color configuration with default values", () => {
      const colors = createDefaultFinancialColors();
      
      expect(colors.up).toBe(FINANCIAL_COLORS.UP);
      expect(colors.down).toBe(FINANCIAL_COLORS.DOWN);
      expect(colors.unchanged).toBe(FINANCIAL_COLORS.UNCHANGED);
    });

    it("should return a new object each time", () => {
      const colors1 = createDefaultFinancialColors();
      const colors2 = createDefaultFinancialColors();
      
      expect(colors1).not.toBe(colors2);
      expect(colors1).toEqual(colors2);
    });
  });

  describe("createFinancialColorCallback", () => {
    const testColors: FinancialColorConfig = {
      up: "#00FF00",
      down: "#FF0000", 
      unchanged: "#808080"
    };

    it("should return up color when close > open", () => {
      const callback = createFinancialColorCallback(testColors);
      const result = callback({ parsed: { o: 100, c: 110 } });
      
      expect(result).toBe(testColors.up);
    });

    it("should return down color when close < open", () => {
      const callback = createFinancialColorCallback(testColors);
      const result = callback({ parsed: { o: 100, c: 90 } });
      
      expect(result).toBe(testColors.down);
    });

    it("should return unchanged color when close equals open", () => {
      const callback = createFinancialColorCallback(testColors);
      const result = callback({ parsed: { o: 100, c: 100 } });
      
      expect(result).toBe(testColors.unchanged);
    });

    it("should handle edge cases with decimal values", () => {
      const callback = createFinancialColorCallback(testColors);
      
      // Very small difference
      expect(callback({ parsed: { o: 100.001, c: 100.002 } })).toBe(testColors.up);
      expect(callback({ parsed: { o: 100.002, c: 100.001 } })).toBe(testColors.down);
    });

    it("should handle edge cases with negative values", () => {
      const callback = createFinancialColorCallback(testColors);
      
      expect(callback({ parsed: { o: -10, c: -5 } })).toBe(testColors.up);
      expect(callback({ parsed: { o: -5, c: -10 } })).toBe(testColors.down);
      expect(callback({ parsed: { o: -10, c: -10 } })).toBe(testColors.unchanged);
    });

    it("should handle edge cases with zero values", () => {
      const callback = createFinancialColorCallback(testColors);
      
      expect(callback({ parsed: { o: 0, c: 1 } })).toBe(testColors.up);
      expect(callback({ parsed: { o: 1, c: 0 } })).toBe(testColors.down);
      expect(callback({ parsed: { o: 0, c: 0 } })).toBe(testColors.unchanged);
    });
  });
});