import { describe, expect, it } from "vitest";

import { STALE_AFTER_DAYS, staleDataDate } from "./dataFreshness";

const now = new Date("2026-10-14T12:00:00Z");

describe("staleDataDate", () => {
  it("names the last bar's date once it trails today by more than the allowance", () => {
    expect(staleDataDate("2026-10-06T04:00:00Z", now)).toBe("2026-10-06");
  });

  it("stays quiet across a long weekend", () => {
    expect(staleDataDate("2026-10-10T04:00:00Z", now)).toBeNull();
  });

  it("flips exactly past the allowance", () => {
    const edge = new Date(now.getTime() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    expect(staleDataDate(edge, now)).toBeNull();
    expect(staleDataDate(new Date(edge.getTime() - 1), now)).not.toBeNull();
  });

  it("reports nothing without a usable date", () => {
    expect(staleDataDate(undefined, now)).toBeNull();
    expect(staleDataDate("not a date", now)).toBeNull();
  });
});
