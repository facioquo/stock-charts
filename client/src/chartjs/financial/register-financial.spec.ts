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
    expect(financial.color).toBeDefined();
    expect(financial.color.up).toBeDefined();
    expect(financial.color.down).toBeDefined();
    expect(financial.color.unchanged).toBeDefined();
  });
});
