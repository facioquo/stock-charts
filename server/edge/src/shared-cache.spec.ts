import { describe, expect, it, vi } from "vitest";

import type { Env } from "./env";
import {
  deployedAt,
  freshFor,
  lastQuoteChange,
  maxAgeMs,
  readShared,
  SHARED_PREFIX,
  sharedKey
} from "./shared-cache";

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

describe("freshFor", () => {
  const changed = Date.parse("2026-11-06T20:20:00Z");

  it("serves an entry for what remains of its max-age, as the per-location cache does", () => {
    const computedAt = changed - MINUTE;
    expect(freshFor(computedAt, WINDOW, changed, computedAt + 10 * MINUTE)).toBe(5 * MINUTE);
    expect(freshFor(computedAt, WINDOW, changed, computedAt + WINDOW)).toBe(0);
  });

  it("refuses an older entry the newest change may not have reached", () => {
    // Computed 20 minutes after the change: the API's own caches may still have
    // held the earlier quotes.
    const computedAt = changed + 20 * MINUTE;
    expect(freshFor(computedAt, WINDOW, changed, computedAt + 2 * WINDOW)).toBeLessThanOrEqual(0);
  });

  it("gives an entry computed two windows after the newest change a full window", () => {
    const computedAt = changed + 2 * WINDOW;
    const nextMorning = changed + 17 * 60 * MINUTE;
    expect(freshFor(computedAt, WINDOW, changed, nextMorning)).toBe(WINDOW);
  });

  it("stops serving it once the quotes change again", () => {
    const computedAt = changed + 2 * WINDOW;
    const nextChange = computedAt + 60 * MINUTE;
    expect(freshFor(computedAt, WINDOW, nextChange, nextChange + WINDOW)).toBeLessThanOrEqual(0);
  });
});

describe("sharedKey", () => {
  it("keys by path and query, not host", async () => {
    const a = await sharedKey(new URL("https://one.example/EMA?lookbackPeriods=20"), "v1");
    const b = await sharedKey(new URL("https://two.example/EMA?lookbackPeriods=20"), "v1");
    const c = await sharedKey(new URL("https://one.example/EMA?lookbackPeriods=21"), "v1");

    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.startsWith(`${SHARED_PREFIX}v1/`)).toBe(true);
    expect(a.slice(`${SHARED_PREFIX}v1/`.length)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("keys each deployed version apart", async () => {
    const url = new URL("https://api.example/EMA?lookbackPeriods=20");
    expect(await sharedKey(url, "v1")).not.toBe(await sharedKey(url, "v2"));
  });
});

const KEY = `${SHARED_PREFIX}v1/entry`;

/** An env whose bucket holds the given datasets (by upload time) and one shared entry. */
function envWith(
  uploads: Record<string, number>,
  entry?: { computedAt: number; maxAge: number },
  deployed = "2026-01-01T00:00:00Z"
) {
  const cancel = vi.fn(() => Promise.resolve());
  const uploadedAt = new Map(Object.entries(uploads));
  const quotes = {
    head: vi.fn((key: string) => {
      const uploaded = uploadedAt.get(key);
      return Promise.resolve(uploaded === undefined ? null : { uploaded: new Date(uploaded) });
    }),
    get: vi.fn((key: string) =>
      Promise.resolve(
        key !== KEY || entry === undefined
          ? null
          : {
              body: { cancel },
              customMetadata: {
                computedAt: String(entry.computedAt),
                headers: JSON.stringify([
                  ["cache-control", `public, max-age=${entry.maxAge / 1000}`],
                  ["vary", "Origin"]
                ])
              }
            }
      )
    )
  };
  const env = {
    QUOTES: quotes,
    QUOTE_SYMBOLS: "spy, QQQ",
    CF_VERSION_METADATA: { id: "v1", tag: "", timestamp: deployed }
  } as unknown as Env;
  return { env, cancel };
}

describe("deployedAt", () => {
  it("reads the version upload time, or 0 when it is unreadable", () => {
    const env = (timestamp: string) =>
      ({ CF_VERSION_METADATA: { id: "v1", tag: "", timestamp } }) as unknown as Env;
    expect(deployedAt(env("2026-11-06T18:00:00Z"))).toBe(Date.parse("2026-11-06T18:00:00Z"));
    expect(deployedAt(env(""))).toBe(0);
  });
});

describe("lastQuoteChange", () => {
  it("takes the newest upload across the configured symbols", async () => {
    const { env } = envWith({ "SPY-DAILY.json": 1_000, "QQQ-DAILY.json": 5_000 });
    expect(await lastQuoteChange(env)).toBe(5_000);
  });

  it("counts a missing dataset as never changed", async () => {
    const { env } = envWith({ "QQQ-DAILY.json": 5_000 });
    expect(await lastQuoteChange(env)).toBe(5_000);
    expect(await lastQuoteChange(envWith({}).env)).toBe(0);
  });
});

describe("readShared", () => {
  const changed = Date.parse("2026-11-06T20:20:00Z");
  const uploads = { "SPY-DAILY.json": changed, "QQQ-DAILY.json": changed };

  it("returns nothing for a missing entry", async () => {
    const { env } = envWith(uploads);
    expect(await readShared(env, KEY, changed)).toBeUndefined();
  });

  it("cuts max-age to the time an entry has left", async () => {
    const computedAt = changed - MINUTE;
    const { env } = envWith(uploads, { computedAt, maxAge: WINDOW });

    const response = await readShared(env, KEY, computedAt + 10 * MINUTE);

    expect(response?.headers.get("cache-control")).toBe("public, max-age=300");
    expect(response?.headers.get("vary")).toBe("Origin");
  });

  it("keeps a full max-age for an entry computed after the newest change settled", async () => {
    const computedAt = changed + 2 * WINDOW;
    const { env } = envWith(uploads, { computedAt, maxAge: WINDOW });

    const response = await readShared(env, KEY, computedAt + 12 * 60 * MINUTE);

    expect(response?.headers.get("cache-control")).toBe("public, max-age=900");
  });

  it("treats a deploy as a change, since the previous image may still be computing", async () => {
    // Quotes settled long ago, but the Worker was deployed 5 minutes before
    // this entry was computed: the container rollout may not have finished.
    const computedAt = changed + 10 * 60 * MINUTE;
    const deployed = new Date(computedAt - 5 * MINUTE).toISOString();
    const { env } = envWith(uploads, { computedAt, maxAge: WINDOW }, deployed);

    expect(await readShared(env, KEY, computedAt + 10 * MINUTE)).toBeDefined();
    expect(await readShared(env, KEY, computedAt + WINDOW)).toBeUndefined();
  });

  it("refuses an entry the newest change may not have reached and releases its body", async () => {
    const computedAt = changed + 5 * MINUTE;
    const { env, cancel } = envWith(uploads, { computedAt, maxAge: WINDOW });

    expect(await readShared(env, KEY, computedAt + WINDOW)).toBeUndefined();
    expect(cancel).toHaveBeenCalledTimes(1);
  });
});
