import {
  ensureFinancialChartsRegistered,
  isFinancialChartsRegistered,
  resetFinancialChartsRegistration
} from "../../../src/chartjs/financial/register-financial";
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
    expect((Chart.defaults.elements as any).financial).toBeDefined();
    expect((Chart.defaults.elements as any).financial.color).toBeDefined();
    expect((Chart.defaults.elements as any).financial.color.up).toBeDefined();
    expect((Chart.defaults.elements as any).financial.color.down).toBeDefined();
    expect((Chart.defaults.elements as any).financial.color.unchanged).toBeDefined();
  });
});
