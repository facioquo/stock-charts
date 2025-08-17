/**
 * Unit tests for financial chart colors and callbacks
 */

import {
  DEFAULT_FINANCIAL_COLORS,
  ENHANCED_FINANCIAL_COLORS,
  VOLUME_COLORS,
  FINANCIAL_CHART_COLORS,
  createCandlestickColorCallback,
  createVolumeColorCallback,
  createCandlestickBorderColorCallback,
  getOhlcColor,
  processFinancialDataColors
} from './colors';
import { FinancialDataPoint } from './financial-chart.registry.d';

describe('Financial Chart Colors', () => {
  const sampleData: FinancialDataPoint[] = [
    { x: 1609459200000, o: 100, h: 110, l: 95, c: 105 }, // Bullish: close > open
    { x: 1609545600000, o: 105, h: 108, l: 98, c: 102 }, // Bearish: close < open
    { x: 1609632000000, o: 102, h: 102, l: 102, c: 102 }, // Unchanged: close = open
  ];

  describe('Color Constants', () => {
    it('should have valid default financial colors', () => {
      expect(DEFAULT_FINANCIAL_COLORS.up).toBe('rgba(80, 160, 115, 1)');
      expect(DEFAULT_FINANCIAL_COLORS.down).toBe('rgba(215, 85, 65, 1)');
      expect(DEFAULT_FINANCIAL_COLORS.unchanged).toBe('rgba(90, 90, 90, 1)');
    });

    it('should have valid enhanced financial colors', () => {
      expect(ENHANCED_FINANCIAL_COLORS.up).toBe('#1B5E20');
      expect(ENHANCED_FINANCIAL_COLORS.down).toBe('#B71C1C');
      expect(ENHANCED_FINANCIAL_COLORS.unchanged).toBe('#616161');
    });

    it('should have valid volume colors with transparency', () => {
      expect(VOLUME_COLORS.up).toBe('#1B5E2060');
      expect(VOLUME_COLORS.down).toBe('#B71C1C60');
      expect(VOLUME_COLORS.unchanged).toBe('#61616160');
    });

    it('should have all color palettes in FINANCIAL_CHART_COLORS', () => {
      expect(FINANCIAL_CHART_COLORS.DEFAULT).toBe(DEFAULT_FINANCIAL_COLORS);
      expect(FINANCIAL_CHART_COLORS.ENHANCED).toBe(ENHANCED_FINANCIAL_COLORS);
      expect(FINANCIAL_CHART_COLORS.VOLUME).toBe(VOLUME_COLORS);
    });
  });

  describe('createCandlestickColorCallback', () => {
    it('should return correct colors based on open/close relationship', () => {
      const callback = createCandlestickColorCallback(ENHANCED_FINANCIAL_COLORS);

      // Test bullish candle (close > open)
      const bullishContext = { parsed: sampleData[0] };
      expect(callback(bullishContext)).toBe(ENHANCED_FINANCIAL_COLORS.up);

      // Test bearish candle (close < open)
      const bearishContext = { parsed: sampleData[1] };
      expect(callback(bearishContext)).toBe(ENHANCED_FINANCIAL_COLORS.down);

      // Test unchanged candle (close = open)
      const unchangedContext = { parsed: sampleData[2] };
      expect(callback(unchangedContext)).toBe(ENHANCED_FINANCIAL_COLORS.unchanged);
    });

    it('should handle missing data gracefully', () => {
      const callback = createCandlestickColorCallback();
      const context = { parsed: null };
      
      expect(callback(context)).toBe(ENHANCED_FINANCIAL_COLORS.unchanged);
    });

    it('should use default colors when none provided', () => {
      const callback = createCandlestickColorCallback();
      const context = { parsed: sampleData[0] };
      
      expect(callback(context)).toBe(ENHANCED_FINANCIAL_COLORS.up);
    });
  });

  describe('createVolumeColorCallback', () => {
    it('should return correct colors for volume based on price direction', () => {
      const callback = createVolumeColorCallback(VOLUME_COLORS);

      // Test bullish volume (close >= open)
      const bullishContext = { parsed: sampleData[0] };
      expect(callback(bullishContext)).toBe(VOLUME_COLORS.up);

      // Test bearish volume (close < open)
      const bearishContext = { parsed: sampleData[1] };
      expect(callback(bearishContext)).toBe(VOLUME_COLORS.down);

      // Test unchanged volume (close = open) - should use up color
      const unchangedContext = { parsed: sampleData[2] };
      expect(callback(unchangedContext)).toBe(VOLUME_COLORS.up);
    });

    it('should handle missing data gracefully', () => {
      const callback = createVolumeColorCallback();
      const context = { parsed: null };
      
      expect(callback(context)).toBe(VOLUME_COLORS.unchanged);
    });
  });

  describe('createCandlestickBorderColorCallback', () => {
    it('should behave the same as candlestick color callback', () => {
      const colorCallback = createCandlestickColorCallback(ENHANCED_FINANCIAL_COLORS);
      const borderCallback = createCandlestickBorderColorCallback(ENHANCED_FINANCIAL_COLORS);

      sampleData.forEach(dataPoint => {
        const context = { parsed: dataPoint };
        expect(colorCallback(context)).toBe(borderCallback(context));
      });
    });
  });

  describe('getOhlcColor', () => {
    it('should return correct colors based on open/close values', () => {
      // Bullish
      expect(getOhlcColor(100, 105, ENHANCED_FINANCIAL_COLORS)).toBe(ENHANCED_FINANCIAL_COLORS.up);
      
      // Bearish
      expect(getOhlcColor(105, 102, ENHANCED_FINANCIAL_COLORS)).toBe(ENHANCED_FINANCIAL_COLORS.down);
      
      // Unchanged
      expect(getOhlcColor(102, 102, ENHANCED_FINANCIAL_COLORS)).toBe(ENHANCED_FINANCIAL_COLORS.unchanged);
    });

    it('should use default colors when none provided', () => {
      expect(getOhlcColor(100, 105)).toBe(ENHANCED_FINANCIAL_COLORS.up);
      expect(getOhlcColor(105, 102)).toBe(ENHANCED_FINANCIAL_COLORS.down);
      expect(getOhlcColor(102, 102)).toBe(ENHANCED_FINANCIAL_COLORS.unchanged);
    });
  });

  describe('processFinancialDataColors', () => {
    it('should process array of financial data points correctly', () => {
      const colors = processFinancialDataColors(sampleData, ENHANCED_FINANCIAL_COLORS);

      expect(colors).toHaveLength(3);
      expect(colors[0]).toBe(ENHANCED_FINANCIAL_COLORS.up);    // Bullish
      expect(colors[1]).toBe(ENHANCED_FINANCIAL_COLORS.down);  // Bearish
      expect(colors[2]).toBe(ENHANCED_FINANCIAL_COLORS.unchanged); // Unchanged
    });

    it('should handle empty array', () => {
      const colors = processFinancialDataColors([]);
      expect(colors).toHaveLength(0);
    });

    it('should use default colors when none provided', () => {
      const colors = processFinancialDataColors(sampleData);
      expect(colors).toHaveLength(3);
      expect(colors[0]).toBe(ENHANCED_FINANCIAL_COLORS.up);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme price values', () => {
      const extremeData: FinancialDataPoint[] = [
        { x: 1, o: 0, h: 1000000, l: 0, c: 999999 },
        { x: 2, o: 999999, h: 999999, l: 0, c: 1 },
        { x: 3, o: 0.001, h: 0.001, l: 0.001, c: 0.001 }
      ];

      const colors = processFinancialDataColors(extremeData);
      expect(colors[0]).toBe(ENHANCED_FINANCIAL_COLORS.up);    // 999999 > 0
      expect(colors[1]).toBe(ENHANCED_FINANCIAL_COLORS.down);  // 1 < 999999
      expect(colors[2]).toBe(ENHANCED_FINANCIAL_COLORS.unchanged); // 0.001 = 0.001
    });

    it('should handle negative prices', () => {
      const negativeData: FinancialDataPoint[] = [
        { x: 1, o: -10, h: -5, l: -15, c: -8 },  // -8 > -10 (bullish)
        { x: 2, o: -5, h: -3, l: -12, c: -10 },  // -10 < -5 (bearish)
      ];

      const colors = processFinancialDataColors(negativeData);
      expect(colors[0]).toBe(ENHANCED_FINANCIAL_COLORS.up);
      expect(colors[1]).toBe(ENHANCED_FINANCIAL_COLORS.down);
    });
  });
});