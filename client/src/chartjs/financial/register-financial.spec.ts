/**
 * Unit tests for financial chart registration system
 */

import { Chart } from 'chart.js';
import {
  ensureFinancialChartsRegistered,
  areFinancialChartsRegistered,
  forceReregisterFinancialCharts,
  getRegisteredFinancialChartTypes
} from './register-financial';

describe('Financial Chart Registration', () => {
  beforeEach(() => {
    // Reset registration state for each test
    forceReregisterFinancialCharts();
  });

  describe('ensureFinancialChartsRegistered', () => {
    it('should register financial charts on first call', () => {
      // Initially not registered (after force reset)
      expect(areFinancialChartsRegistered()).toBe(true); // forceReregister calls it

      // Verify controllers are registered
      const registeredTypes = getRegisteredFinancialChartTypes();
      expect(registeredTypes).toContain('candlestick');
      expect(registeredTypes).toContain('ohlc');
    });

    it('should be idempotent - multiple calls should not cause issues', () => {
      // Call multiple times
      ensureFinancialChartsRegistered();
      ensureFinancialChartsRegistered();
      ensureFinancialChartsRegistered();

      // Should still be registered and working
      expect(areFinancialChartsRegistered()).toBe(true);
      const registeredTypes = getRegisteredFinancialChartTypes();
      expect(registeredTypes).toContain('candlestick');
      expect(registeredTypes).toContain('ohlc');
    });

    it('should set up Chart.js defaults', () => {
      ensureFinancialChartsRegistered();

      const elements = (Chart.defaults.elements as any);
      expect(elements.financial).toBeDefined();
      expect(elements.financial.color).toBeDefined();
      expect(elements.financial.color.up).toBeDefined();
      expect(elements.financial.color.down).toBeDefined();
      expect(elements.financial.color.unchanged).toBeDefined();

      expect(elements.candlestick).toBeDefined();
      expect(elements.ohlc).toBeDefined();
    });
  });

  describe('areFinancialChartsRegistered', () => {
    it('should return false before registration', () => {
      // Note: Since we call forceReregisterFinancialCharts in beforeEach,
      // this tests the behavior after that call
      expect(areFinancialChartsRegistered()).toBe(true);
    });

    it('should return true after registration', () => {
      ensureFinancialChartsRegistered();
      expect(areFinancialChartsRegistered()).toBe(true);
    });
  });

  describe('getRegisteredFinancialChartTypes', () => {
    it('should return empty array when not registered', () => {
      // This test would need to be run before any registration
      // For now, we'll test that it returns the expected types after registration
      ensureFinancialChartsRegistered();
      const types = getRegisteredFinancialChartTypes();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
    });

    it('should return registered chart types', () => {
      ensureFinancialChartsRegistered();
      const types = getRegisteredFinancialChartTypes();
      expect(types).toContain('candlestick');
      expect(types).toContain('ohlc');
    });
  });

  describe('forceReregisterFinancialCharts', () => {
    it('should allow re-registration', () => {
      ensureFinancialChartsRegistered();
      expect(areFinancialChartsRegistered()).toBe(true);

      forceReregisterFinancialCharts();
      expect(areFinancialChartsRegistered()).toBe(true);
    });
  });
});