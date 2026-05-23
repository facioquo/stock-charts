import { describe, it, expect } from "vitest";

import { getTestIdPrefix, slug, STOCK_INDICATOR_CHART_TESTID_PREFIX } from "./slug";

describe("slug", () => {
  it("lowercases ASCII letters", () => {
    expect(slug("HtTrendline")).toBe("httrendline");
  });

  it("collapses runs of non-alphanumeric chars to a single dash", () => {
    expect(slug("BB(20, 2)")).toBe("bb-20-2");
  });

  it("trims leading and trailing dashes", () => {
    expect(slug("  --foo--  ")).toBe("foo");
  });

  it("returns an empty string when input contains no alphanumeric chars", () => {
    expect(slug("---")).toBe("");
  });
});

describe("getTestIdPrefix", () => {
  it("prepends the canonical chart prefix to the slugified id", () => {
    expect(getTestIdPrefix("RSI")).toBe(`${STOCK_INDICATOR_CHART_TESTID_PREFIX}-rsi`);
  });

  it("matches the prefix the component emits on its root data-testid", () => {
    expect(getTestIdPrefix("sma-fast")).toBe("stock-indicator-chart-sma-fast");
  });
});
