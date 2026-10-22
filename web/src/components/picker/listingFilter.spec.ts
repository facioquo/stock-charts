import { describe, expect, it } from "vitest";

import type { IndicatorListing } from "../../types/chart.types";
import { filterListings } from "./listingFilter";

function makeListing(uiid: string, name: string, category: string): IndicatorListing {
  return {
    name,
    uiid,
    category,
    legendTemplate: name,
    endpoint: `${uiid}/`,
    chartType: "overlay",
    order: 0,
    chartConfig: null,
    parameters: [],
    results: []
  };
}

const listings = [
  makeListing("KVO", "Klinger Volume Oscillator", "volume-based"),
  makeListing("RSI", "Relative Strength Index", "oscillator"),
  makeListing("SMA", "Simple Moving Average", "moving-average")
];

const names = (query: string): string[] => filterListings(listings, query).map(l => l.name);

describe("filterListings", () => {
  it("keeps every listing for a blank query", () => {
    expect(filterListings(listings, "  ")).toBe(listings);
  });

  it("matches part of a name, ignoring case", () => {
    expect(names("klinger")).toEqual(["Klinger Volume Oscillator"]);
  });

  it("matches the indicator id", () => {
    expect(names("rsi")).toEqual(["Relative Strength Index"]);
  });

  it("matches the category label, not only its slug", () => {
    expect(names("moving averages")).toEqual(["Simple Moving Average"]);
    expect(names("volume-based")).toEqual(["Klinger Volume Oscillator"]);
  });

  it("requires every word, in any order", () => {
    expect(names("oscillator volume")).toEqual(["Klinger Volume Oscillator"]);
    expect(names("oscillator strength")).toEqual(["Relative Strength Index"]);
  });

  it("returns nothing when no listing matches", () => {
    expect(names("zzz")).toEqual([]);
  });
});
