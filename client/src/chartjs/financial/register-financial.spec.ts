/*!
 * Unit tests for financial chart registration system
 */

import { Chart } from "chart.js";
import {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from "./register-financial";

describe("Financial Charts Registration", () => {
  beforeEach(() => {
    // Reset registration state before each test
    resetFinancialChartsRegistration();
  });

  afterEach(() => {
    // Clean up after each test
    resetFinancialChartsRegistration();
  });

  describe("ensureFinancialChartsRegistered", () => {
    it("should register financial charts on first call", () => {
      expect(isFinancialChartsRegistered()).toBe(false);

      ensureFinancialChartsRegistered();

      expect(isFinancialChartsRegistered()).toBe(true);
    });

    it("should be idempotent - safe to call multiple times", () => {
      expect(isFinancialChartsRegistered()).toBe(false);

      // Call multiple times
      ensureFinancialChartsRegistered();
      ensureFinancialChartsRegistered();
      ensureFinancialChartsRegistered();

      expect(isFinancialChartsRegistered()).toBe(true);
    });

    it("should set up financial element defaults", () => {
      ensureFinancialChartsRegistered();

      const chartDefaults = Chart.defaults as any;
      expect(chartDefaults.elements.financial).toBeDefined();
      expect(chartDefaults.elements.financial.color).toBeDefined();
      expect(chartDefaults.elements.financial.color.up).toBe("rgba(80, 160, 115, 1)");
      expect(chartDefaults.elements.financial.color.down).toBe("rgba(215, 85, 65, 1)");
      expect(chartDefaults.elements.financial.color.unchanged).toBe("rgba(90, 90, 90, 1)");
    });

    it("should set up candlestick element defaults", () => {
      ensureFinancialChartsRegistered();

      const chartDefaults = Chart.defaults as any;
      expect(chartDefaults.elements.candlestick).toBeDefined();
      expect(chartDefaults.elements.candlestick.borderWidth).toBe(1);
    });

    it("should set up ohlc element defaults", () => {
      ensureFinancialChartsRegistered();

      const chartDefaults = Chart.defaults as any;
      expect(chartDefaults.elements.ohlc).toBeDefined();
      expect(chartDefaults.elements.ohlc.lineWidth).toBe(2);
      expect(chartDefaults.elements.ohlc.armLengthRatio).toBe(0.8);
    });
  });

  describe("isFinancialChartsRegistered", () => {
    it("should return false initially", () => {
      expect(isFinancialChartsRegistered()).toBe(false);
    });

    it("should return true after registration", () => {
      ensureFinancialChartsRegistered();
      expect(isFinancialChartsRegistered()).toBe(true);
    });
  });

  describe("resetFinancialChartsRegistration", () => {
    it("should reset registration state", () => {
      ensureFinancialChartsRegistered();
      expect(isFinancialChartsRegistered()).toBe(true);

      resetFinancialChartsRegistration();
      expect(isFinancialChartsRegistered()).toBe(false);
    });
  });
});
