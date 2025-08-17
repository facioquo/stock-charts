/*!
 * Unit tests for financial chart color utilities
 */

import {
  DEFAULT_FINANCIAL_COLORS,
  GREEN_RED_COLORS,
  DARK_THEME_COLORS,
  generateVolumeColors,
  createCandlestickColorCallback,
  createFinancialBorderColors
} from "../utils/colors";

describe("Financial Chart Colors", () => {
  describe("Color Schemes", () => {
    it("should have default financial colors defined", () => {
      expect(DEFAULT_FINANCIAL_COLORS.up).toBe("rgba(80, 160, 115, 1)");
      expect(DEFAULT_FINANCIAL_COLORS.down).toBe("rgba(215, 85, 65, 1)");
      expect(DEFAULT_FINANCIAL_COLORS.unchanged).toBe("rgba(90, 90, 90, 1)");
    });

    it("should have green-red color scheme defined", () => {
      expect(GREEN_RED_COLORS.up).toBe("#00C851");
      expect(GREEN_RED_COLORS.down).toBe("#FF4444");
      expect(GREEN_RED_COLORS.unchanged).toBe("#666666");
    });

    it("should have dark theme colors defined", () => {
      expect(DARK_THEME_COLORS.up).toBe("#4CAF50");
      expect(DARK_THEME_COLORS.down).toBe("#F44336");
      expect(DARK_THEME_COLORS.unchanged).toBe("#9E9E9E");
    });
  });

  describe("generateVolumeColors", () => {
    it("should generate colors based on price movement", () => {
      const quotes = [
        { open: 100, close: 105 }, // up
        { open: 105, close: 102 }, // down
        { open: 102, close: 102 }, // unchanged
        { open: 102, close: 108 } // up
      ];

      const colors = generateVolumeColors(quotes);

      expect(colors).toHaveLength(4);
      expect(colors[0]).toBe(DEFAULT_FINANCIAL_COLORS.up);
      expect(colors[1]).toBe(DEFAULT_FINANCIAL_COLORS.down);
      expect(colors[2]).toBe(DEFAULT_FINANCIAL_COLORS.unchanged);
      expect(colors[3]).toBe(DEFAULT_FINANCIAL_COLORS.up);
    });

    it("should use custom color scheme when provided", () => {
      const quotes = [{ open: 100, close: 105 }];
      const colors = generateVolumeColors(quotes, GREEN_RED_COLORS);

      expect(colors[0]).toBe(GREEN_RED_COLORS.up);
    });

    it("should handle empty quotes array", () => {
      const colors = generateVolumeColors([]);
      expect(colors).toHaveLength(0);
    });
  });

  describe("createCandlestickColorCallback", () => {
    it("should return a function", () => {
      const callback = createCandlestickColorCallback();
      expect(typeof callback).toBe("function");
    });

    it("should return correct colors based on price movement", () => {
      const callback = createCandlestickColorCallback();

      // Test up movement
      const upCtx = { parsed: { o: 100, c: 105 } };
      expect(callback(upCtx)).toBe(DEFAULT_FINANCIAL_COLORS.up);

      // Test down movement
      const downCtx = { parsed: { o: 105, c: 100 } };
      expect(callback(downCtx)).toBe(DEFAULT_FINANCIAL_COLORS.down);

      // Test unchanged
      const unchangedCtx = { parsed: { o: 100, c: 100 } };
      expect(callback(unchangedCtx)).toBe(DEFAULT_FINANCIAL_COLORS.unchanged);
    });

    it("should handle missing parsed data", () => {
      const callback = createCandlestickColorCallback();
      const ctx = { parsed: null };

      expect(callback(ctx)).toBe(DEFAULT_FINANCIAL_COLORS.unchanged);
    });

    it("should use custom color scheme when provided", () => {
      const callback = createCandlestickColorCallback(GREEN_RED_COLORS);
      const ctx = { parsed: { o: 100, c: 105 } };

      expect(callback(ctx)).toBe(GREEN_RED_COLORS.up);
    });
  });

  describe("createFinancialBorderColors", () => {
    it("should return color scheme for borders", () => {
      const borderColors = createFinancialBorderColors();

      expect(borderColors.up).toBe(DEFAULT_FINANCIAL_COLORS.up);
      expect(borderColors.down).toBe(DEFAULT_FINANCIAL_COLORS.down);
      expect(borderColors.unchanged).toBe(DEFAULT_FINANCIAL_COLORS.unchanged);
    });

    it("should use custom color scheme when provided", () => {
      const borderColors = createFinancialBorderColors(DARK_THEME_COLORS);

      expect(borderColors.up).toBe(DARK_THEME_COLORS.up);
      expect(borderColors.down).toBe(DARK_THEME_COLORS.down);
      expect(borderColors.unchanged).toBe(DARK_THEME_COLORS.unchanged);
    });
  });
});
