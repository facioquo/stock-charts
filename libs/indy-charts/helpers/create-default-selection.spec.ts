import { describe, expect, it } from "vitest";

import { createDefaultSelection } from "./create-default-selection";
import type { IndicatorListing } from "../config";

/** Minimal listing fixture for testing. */
function makeListing(overrides?: Partial<IndicatorListing>): IndicatorListing {
  return {
    uiid: "SMA",
    name: "Simple Moving Average",
    legendTemplate: "SMA([P1])",
    chartType: "overlay",
    order: 10,
    endpoint: "/indicators/sma",
    category: "moving-average",
    chartConfig: null,
    parameters: [
      {
        paramName: "lookbackPeriods",
        displayName: "Periods",
        minimum: 1,
        maximum: 200,
        defaultValue: 20
      }
    ],
    results: [
      {
        dataName: "sma",
        displayName: "SMA",
        tooltipTemplate: "SMA([P1])",
        defaultColor: "#1E88E5",
        lineType: "solid",
        lineWidth: 2,
        dataType: "number",
        stack: "",
        order: 10
      }
    ],
    ...overrides
  } as IndicatorListing;
}

describe("createDefaultSelection", () => {
  it("creates a selection with default parameter values from the listing", () => {
    const listing = makeListing();
    const selection = createDefaultSelection(listing);

    expect(selection.uiid).toBe("SMA");
    expect(selection.label).toBe("SMA([P1])");
    expect(selection.chartType).toBe("overlay");
    expect(selection.ucid).toBeDefined();
    expect(selection.ucid.length).toBeGreaterThan(0);
    expect(selection.params).toHaveLength(1);
    expect(selection.params[0].paramName).toBe("lookbackPeriods");
    expect(selection.params[0].value).toBe(20);
    expect(selection.results).toHaveLength(1);
    expect(selection.results[0].dataName).toBe("sma");
    expect(selection.results[0].color).toBe("#1E88E5");
  });

  it("applies parameter overrides", () => {
    const listing = makeListing();
    const selection = createDefaultSelection(listing, { lookbackPeriods: 50 });

    expect(selection.params[0].value).toBe(50);
  });

  it("uses default values when override key does not match", () => {
    const listing = makeListing();
    const selection = createDefaultSelection(listing, { notAParam: 99 });

    expect(selection.params[0].value).toBe(20);
  });

  it("handles listings with no parameters", () => {
    const listing = makeListing({ parameters: undefined });
    const selection = createDefaultSelection(listing);

    expect(selection.params).toHaveLength(0);
    expect(selection.results).toHaveLength(1);
  });

  it("generates unique IDs across calls", () => {
    const listing = makeListing();
    const first = createDefaultSelection(listing);
    const second = createDefaultSelection(listing);

    expect(first.ucid).not.toBe(second.ucid);
  });

  it("uses custom ID prefix", () => {
    const listing = makeListing();
    const selection = createDefaultSelection(listing, undefined, "vp-");

    expect(selection.ucid).toMatch(/^vp-/);
  });

  it("initializes result datasets as empty line datasets", () => {
    const listing = makeListing();
    const selection = createDefaultSelection(listing);

    expect(selection.results[0].dataset).toBeDefined();
    expect(selection.results[0].dataset.type).toBe("line");
    expect(selection.results[0].dataset.data).toEqual([]);
  });

  it("applies lineWidth fallback when listing has non-numeric lineWidth", () => {
    const listing = makeListing({
      results: [
        {
          dataName: "sma",
          displayName: "SMA",
          tooltipTemplate: "SMA([P1])",
          defaultColor: "#1E88E5",
          lineType: "solid",
          lineWidth: undefined as unknown as number | null,
          dataType: "number",
          stack: "",
          order: 10
        }
      ]
    });
    const selection = createDefaultSelection(listing);

    expect(selection.results[0].lineWidth).toBe(2);
  });
});
