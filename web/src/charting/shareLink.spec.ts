import { createDefaultSelection } from "@facioquo/indy-charts";
import { describe, expect, it } from "vitest";

import type { IndicatorListing } from "../types/chart.types";

import { buildShareUrl, decodeSelections, encodeSelections, SHARE_PARAM } from "./shareLink";

const sma: IndicatorListing = {
  name: "SMA",
  uiid: "SMA",
  legendTemplate: "SMA([P1])",
  endpoint: "/SMA/",
  category: "moving-average",
  chartType: "overlay",
  order: 1,
  chartConfig: null,
  parameters: [
    {
      paramName: "lookbackPeriods",
      displayName: "Lookback",
      dataType: "int",
      minimum: 1,
      maximum: 250,
      defaultValue: 20
    }
  ],
  results: [
    {
      displayName: "SMA",
      tooltipTemplate: "SMA",
      dataName: "sma",
      dataType: "number",
      lineType: "solid",
      defaultColor: "#0000ff",
      lineWidth: 2
    }
  ]
} as unknown as IndicatorListing;

const obv: IndicatorListing = {
  ...sma,
  name: "OBV",
  uiid: "OBV",
  legendTemplate: "OBV",
  chartType: "oscillator",
  parameters: []
};

const listings = [sma, obv];

describe("share link encoding", () => {
  it("round-trips order, parameters, and result styling", () => {
    const first = createDefaultSelection(sma, { lookbackPeriods: 50 });
    const [result] = first.results;
    if (result) {
      result.color = "#ff0000";
      result.lineType = "dash";
      result.lineWidth = 3;
    }
    const second = createDefaultSelection(obv);

    const decoded = decodeSelections(encodeSelections([first, second], listings), listings);

    expect(decoded.map(s => s.uiid)).toEqual(["SMA", "OBV"]);
    expect(decoded[0]?.params[0]?.value).toBe(50);
    expect(decoded[0]?.results[0]).toMatchObject({
      color: "#ff0000",
      lineType: "dash",
      lineWidth: 3
    });
  });

  it("omits styling that matches the listing default", () => {
    const encoded = encodeSelections([createDefaultSelection(sma)], listings);
    const payload: unknown = JSON.parse(
      atob(encoded.slice(2).replaceAll("-", "+").replaceAll("_", "/"))
    );
    expect(payload).toEqual([["SMA", [20], []]]);
  });

  it("starts with the format version", () => {
    expect(encodeSelections([], listings)).toMatch(/^1\./);
  });

  it("ignores an unknown version, garbage, and a payload that is not a list", () => {
    const valid = encodeSelections([createDefaultSelection(sma)], listings);
    expect(decodeSelections(`2.${valid.slice(2)}`, listings)).toEqual([]);
    expect(decodeSelections("1.@@@@", listings)).toEqual([]);
    expect(decodeSelections("nodot", listings)).toEqual([]);
    expect(decodeSelections(`1.${btoa('{"a":1}')}`, listings)).toEqual([]);
  });

  it("skips unknown indicators and falls back to the default for an out-of-range value", () => {
    const payload = btoa(JSON.stringify([["NOPE", [1], []], ["SMA", [9999], []], "junk"]));
    const decoded = decodeSelections(`1.${payload}`, listings);

    expect(decoded).toHaveLength(1);
    expect(decoded[0]?.uiid).toBe("SMA");
    expect(decoded[0]?.params[0]?.value).toBe(20);
  });

  const payloadOf = (entries: unknown[]): string =>
    `1.${btoa(JSON.stringify(entries)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "")}`;

  it("ignores a link over the length cap", () => {
    const entries = Array.from({ length: 2000 }, () => ["SMA", [20], []]);
    const encoded = payloadOf(entries);
    expect(encoded.length).toBeGreaterThan(8192);
    expect(decodeSelections(encoded, listings)).toEqual([]);
  });

  it("caps the number of indicators and drops repeated entries", () => {
    const distinct = Array.from({ length: 120 }, (_, i) => ["SMA", [i + 1], []]);
    expect(decodeSelections(payloadOf(distinct), listings)).toHaveLength(50);

    const repeated = Array.from({ length: 20 }, () => ["SMA", [20], []]);
    expect(decodeSelections(payloadOf(repeated), listings)).toHaveLength(1);
  });

  it("applies only styles the settings dialog could produce", () => {
    const decoded = decodeSelections(
      payloadOf([
        ["SMA", [20], [["red", "dash", 2]]],
        ["SMA", [21], [["#ff0000", "candle", 2]]],
        ["SMA", [22], [["#ff0000", "dash", 1e9]]],
        ["SMA", [23], [["#ff0000", "dots", 2]]]
      ]),
      listings
    );

    const base = createDefaultSelection(sma).results[0];
    expect(decoded.map(s => s.results[0]?.color)).toEqual([
      base?.color,
      base?.color,
      base?.color,
      "#ff0000"
    ]);
    expect(decoded[1]?.results[0]?.lineType).toBe(base?.lineType);
    expect(decoded[2]?.results[0]?.lineWidth).toBe(base?.lineWidth);
  });

  it("falls back to the default for a fractional integer parameter", () => {
    const [decoded] = decodeSelections(payloadOf([["SMA", [2.5], []]]), listings);
    expect(decoded?.params[0]?.value).toBe(20);
  });

  it("builds a URL on the current path carrying only the share parameter", () => {
    const url = new URL(
      buildShareUrl([createDefaultSelection(sma)], listings, {
        origin: "https://charts.example",
        pathname: "/"
      })
    );
    expect(url.origin + url.pathname).toBe("https://charts.example/");
    expect([...url.searchParams.keys()]).toEqual([SHARE_PARAM]);
    expect(decodeSelections(url.searchParams.get(SHARE_PARAM) ?? "", listings)).toHaveLength(1);
  });
});
