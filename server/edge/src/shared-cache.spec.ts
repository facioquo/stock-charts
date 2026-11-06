import { describe, expect, it } from "vitest";

import { isCurrent, maxAgeMs, SHARED_PREFIX, sharedKey } from "./shared-cache";

const MINUTE = 60_000;
const WINDOW = 15 * MINUTE;

describe("maxAgeMs", () => {
  it("reads max-age in milliseconds", () => {
    expect(maxAgeMs("public, max-age=900")).toBe(900_000);
  });

  it("ignores s-maxage and absent values", () => {
    expect(maxAgeMs("public, s-maxage=900")).toBeNull();
    expect(maxAgeMs(null)).toBeNull();
  });
});

describe("isCurrent", () => {
  const changed = Date.parse("2026-11-06T20:20:00Z");

  it("serves any entry younger than its max-age, as the per-location cache does", () => {
    const computedAt = changed - MINUTE;
    expect(isCurrent(computedAt, WINDOW, changed, computedAt + WINDOW - 1)).toBe(true);
  });

  it("refuses an older entry the newest change may not have reached", () => {
    // Computed 20 minutes after the change: the API's own caches may still have
    // held the earlier quotes.
    const computedAt = changed + 20 * MINUTE;
    expect(isCurrent(computedAt, WINDOW, changed, computedAt + 2 * WINDOW)).toBe(false);
  });

  it("keeps serving an entry computed two windows after the newest change", () => {
    const computedAt = changed + 2 * WINDOW;
    const nextMorning = changed + 17 * 60 * MINUTE;
    expect(isCurrent(computedAt, WINDOW, changed, nextMorning)).toBe(true);
  });

  it("stops serving it once the quotes change again", () => {
    const computedAt = changed + 2 * WINDOW;
    const nextChange = computedAt + 60 * MINUTE;
    expect(isCurrent(computedAt, WINDOW, nextChange, nextChange + WINDOW)).toBe(false);
  });
});

describe("sharedKey", () => {
  it("keys by path and query, not host", async () => {
    const a = await sharedKey(new URL("https://one.example/EMA?lookbackPeriods=20"));
    const b = await sharedKey(new URL("https://two.example/EMA?lookbackPeriods=20"));
    const c = await sharedKey(new URL("https://one.example/EMA?lookbackPeriods=21"));

    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(new RegExp(`^${SHARED_PREFIX}[0-9a-f]{64}$`));
  });
});
