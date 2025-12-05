import {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from "./register-financial";
import { Chart } from "chart.js";

describe("Financial Chart Registration", () => {
  beforeEach(() => {
    // Reset registration state before each test
    resetFinancialChartsRegistration();
  });

  it("should register financial charts components", () => {
    expect(isFinancialChartsRegistered()).toBe(false);

    ensureFinancialChartsRegistered();

    expect(isFinancialChartsRegistered()).toBe(true);
  });

  it("should be idempotent - multiple calls should not cause issues", () => {
    expect(isFinancialChartsRegistered()).toBe(false);

    ensureFinancialChartsRegistered();
    ensureFinancialChartsRegistered();
    ensureFinancialChartsRegistered();

    expect(isFinancialChartsRegistered()).toBe(true);
  });

  it("should set up Chart.js defaults", () => {
    ensureFinancialChartsRegistered();

    // Check that financial defaults exist
    const elements = Chart.defaults.elements as unknown as Record<string, unknown>;
    expect(elements.financial).toBeDefined();
    const financial = elements.financial as Record<string, Record<string, unknown>>;
    expect(financial.backgroundColors).toBeDefined();
    expect(financial.backgroundColors.up).toBeDefined();
    expect(financial.backgroundColors.down).toBeDefined();
    expect(financial.backgroundColors.unchanged).toBeDefined();
    expect(financial.borderColors).toBeDefined();
    expect(financial.borderColors.up).toBeDefined();
    expect(financial.borderColors.down).toBeDefined();
    expect(financial.borderColors.unchanged).toBeDefined();
  });
});
