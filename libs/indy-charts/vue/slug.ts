/**
 * Slugify a chart identifier the same way `<StockIndicatorChart>` derives its
 * root element id and `data-testid` prefix. Use in tests, styles, or
 * imperative DOM queries to ensure selector parity with the component output.
 *
 * @example
 *   slug("HtTrendline"); // "httrendline"
 *   slug("BB(20, 2)");   // "bb-20-2"
 */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Prefix prepended to every `data-testid` on a `<StockIndicatorChart>` instance. */
export const STOCK_INDICATOR_CHART_TESTID_PREFIX = "stock-indicator-chart";

/**
 * Compute the `data-testid` prefix `<StockIndicatorChart>` exposes for a given
 * `id` or `indicator` value. Equivalent to
 * `\`${STOCK_INDICATOR_CHART_TESTID_PREFIX}-${slug(idOrIndicator)}\`` — provided
 * as a single helper so consumer tests don't reimplement the prefix string.
 *
 * @example
 *   const root = page.locator(`[data-testid="${getTestIdPrefix("RSI")}-root"]`);
 */
export function getTestIdPrefix(idOrIndicator: string): string {
  return `${STOCK_INDICATOR_CHART_TESTID_PREFIX}-${slug(idOrIndicator)}`;
}
