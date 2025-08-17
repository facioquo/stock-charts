/**
 * Unit tests for financial chart registration system
 */

import { Chart } from "chart.js";
import {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetRegistrationState
} from "./register-financial";

describe("Financial Chart Registration", () => {
  beforeEach(() => {
    // Reset registration state before each test
    resetRegistrationState();
  });

  afterEach(() => {
    // Clean up after each test
    resetRegistrationState();
  });

  it("should register financial charts when called for the first time", () => {
    expect(isFinancialChartsRegistered()).toBe(false);
    
    ensureFinancialChartsRegistered();
    
    expect(isFinancialChartsRegistered()).toBe(true);
  });

  it("should be idempotent - multiple calls should not cause issues", () => {
    expect(isFinancialChartsRegistered()).toBe(false);
    
    // Call multiple times
    ensureFinancialChartsRegistered();
    ensureFinancialChartsRegistered();
    ensureFinancialChartsRegistered();
    
    expect(isFinancialChartsRegistered()).toBe(true);
  });

  it("should set up Chart.js defaults for financial elements", () => {
    ensureFinancialChartsRegistered();
    
    // Check that financial defaults are set
    const chartDefaults = Chart.defaults as any;
    expect(chartDefaults.elements.financial).toBeDefined();
    expect(chartDefaults.elements.financial.color).toBeDefined();
    expect(chartDefaults.elements.financial.color.up).toBeDefined();
    expect(chartDefaults.elements.financial.color.down).toBeDefined();
    expect(chartDefaults.elements.financial.color.unchanged).toBeDefined();
  });

  it("should set up Chart.js defaults for candlestick elements", () => {
    ensureFinancialChartsRegistered();
    
    // Check that candlestick defaults are set
    const chartDefaults = Chart.defaults as any;
    expect(chartDefaults.elements.candlestick).toBeDefined();
    expect(chartDefaults.elements.candlestick.borderWidth).toBe(1);
  });

  it("should set up Chart.js defaults for OHLC elements", () => {
    ensureFinancialChartsRegistered();
    
    // Check that OHLC defaults are set
    const chartDefaults = Chart.defaults as any;
    expect(chartDefaults.elements.ohlc).toBeDefined();
    expect(chartDefaults.elements.ohlc.borderWidth).toBe(1);
  });

  it("should set up financial chart defaults", () => {
    ensureFinancialChartsRegistered();
    
    // Check that financial chart defaults are set
    const chartDefaults = Chart.defaults as any;
    expect(chartDefaults.financial).toBeDefined();
    expect(chartDefaults.financial.datasets).toBeDefined();
    expect(chartDefaults.financial.datasets.barPercentage).toBe(1.0);
    expect(chartDefaults.financial.datasets.categoryPercentage).toBe(1.0);
  });

  it("should reset registration state for testing", () => {
    ensureFinancialChartsRegistered();
    expect(isFinancialChartsRegistered()).toBe(true);
    
    resetRegistrationState();
    expect(isFinancialChartsRegistered()).toBe(false);
    
    // Should be able to register again
    ensureFinancialChartsRegistered();
    expect(isFinancialChartsRegistered()).toBe(true);
  });
});