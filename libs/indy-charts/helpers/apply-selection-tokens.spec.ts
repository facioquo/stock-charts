import { describe, expect, it } from "vitest";

import { applySelectionTokens } from "./apply-selection-tokens";
import type { IndicatorSelection } from "../config";

/** Stub dataset for test results. */
const emptyDataset = { type: "line" as const, data: [] };

/** Minimal selection with tokens for testing. */
function makeSelection(overrides?: Partial<IndicatorSelection>): IndicatorSelection {
  return {
    ucid: "test-id-1",
    uiid: "BB",
    label: "Bollinger Bands([P1],[P2])",
    chartType: "overlay",
    params: [
      { paramName: "lookbackPeriods", displayName: "Periods", minimum: 1, maximum: 200, value: 20 },
      {
        paramName: "standardDeviations",
        displayName: "Std Dev",
        minimum: 0.1,
        maximum: 5,
        value: 2
      }
    ],
    results: [
      {
        label: "Upper([P1],[P2])",
        color: "#1E88E5",
        dataName: "upperBand",
        displayName: "Upper Band",
        lineType: "solid",
        lineWidth: 2,
        order: 10,
        dataset: emptyDataset
      },
      {
        label: "Lower([P1],[P2])",
        color: "#E53935",
        dataName: "lowerBand",
        displayName: "Lower Band",
        lineType: "solid",
        lineWidth: 2,
        order: 11,
        dataset: emptyDataset
      }
    ],
    ...overrides
  };
}

describe("applySelectionTokens", () => {
  it("replaces [P1] and [P2] tokens in selection label", () => {
    const selection = makeSelection();
    const result = applySelectionTokens(selection);

    expect(result.label).toBe("Bollinger Bands(20,2)");
  });

  it("replaces tokens in result labels", () => {
    const selection = makeSelection();
    const result = applySelectionTokens(selection);

    expect(result.results[0].label).toBe("Upper(20,2)");
    expect(result.results[1].label).toBe("Lower(20,2)");
  });

  it("returns the same selection reference (mutates in place)", () => {
    const selection = makeSelection();
    const result = applySelectionTokens(selection);

    expect(result).toBe(selection);
  });

  it("skips params with null value", () => {
    const selection = makeSelection();
    selection.params[0].value = null as unknown as number | undefined;
    applySelectionTokens(selection);

    expect(selection.label).toBe("Bollinger Bands([P1],2)");
    expect(selection.results[0].label).toBe("Upper([P1],2)");
  });

  it("skips params with undefined value", () => {
    const selection = makeSelection();
    selection.params[0].value = undefined;
    applySelectionTokens(selection);

    expect(selection.label).toBe("Bollinger Bands([P1],2)");
  });

  it("handles selection with no params", () => {
    const selection = makeSelection({ params: [] });
    const original = selection.label;
    applySelectionTokens(selection);

    expect(selection.label).toBe(original);
  });

  it("handles single param token", () => {
    const selection = makeSelection({
      label: "SMA([P1])",
      params: [
        {
          paramName: "lookbackPeriods",
          displayName: "Periods",
          minimum: 1,
          maximum: 200,
          value: 14
        }
      ],
      results: [
        {
          label: "SMA([P1])",
          color: "#1E88E5",
          dataName: "sma",
          displayName: "SMA",
          lineType: "solid",
          lineWidth: 2,
          order: 10,
          dataset: emptyDataset
        }
      ]
    });
    applySelectionTokens(selection);

    expect(selection.label).toBe("SMA(14)");
    expect(selection.results[0].label).toBe("SMA(14)");
  });

  it("replaces all occurrences of a repeated token", () => {
    const selection = makeSelection({
      label: "Custom [P1]-[P1]",
      params: [
        {
          paramName: "lookbackPeriods",
          displayName: "Periods",
          minimum: 1,
          maximum: 200,
          value: 10
        }
      ],
      results: [
        {
          label: "R [P1]/[P1]",
          color: "#1E88E5",
          dataName: "result",
          displayName: "Result",
          lineType: "solid",
          lineWidth: 2,
          order: 10,
          dataset: emptyDataset
        }
      ]
    });
    applySelectionTokens(selection);

    expect(selection.label).toBe("Custom 10-10");
    expect(selection.results[0].label).toBe("R 10/10");
  });
});
