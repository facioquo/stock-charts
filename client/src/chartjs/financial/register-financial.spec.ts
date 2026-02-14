import { Chart } from "chart.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  __resetFinancialChartsRegistrationForTests,
  registerFinancialCharts,
  financialRegisterables
} from "./register-financial";

describe("financial registration", () => {
  beforeEach(() => {
    __resetFinancialChartsRegistrationForTests();
  });

  it("registers exactly once when called repeatedly", () => {
    const registerSpy = vi.spyOn(Chart, "register");

    registerFinancialCharts();
    const callsAfterFirstEnsure = registerSpy.mock.calls.length;
    registerFinancialCharts();

    expect(callsAfterFirstEnsure).toBeGreaterThan(0);
    expect(registerSpy.mock.calls.length).toBe(callsAfterFirstEnsure);
    expect(registerSpy.mock.calls[0]).toEqual(financialRegisterables as unknown as unknown[]);
    registerSpy.mockRestore();
  });
});
