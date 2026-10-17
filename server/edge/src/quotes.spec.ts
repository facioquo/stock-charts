import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "./env";
import {
  datasetKey,
  isStale,
  missedWeekdays,
  refreshQuotes,
  staleDatasets,
  toStoredBars,
  type StoredBar
} from "./quotes";

/**
 * The same fixture `server/WebApi.Tests/Services/QuoteDatasetContractTests.cs`
 * deserializes. Asserting against it from both sides is what stops the R2
 * dataset contract from drifting: the API parses with case-sensitive options,
 * so a camelCase regression here would produce default-valued bars rather than
 * an error.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../quote-dataset.contract.json"
);

const contract = JSON.parse(readFileSync(contractPath, "utf8")) as StoredBar[];

describe("toStoredBars", () => {
  it("produces exactly the shared contract shape", () => {
    const mapped = toStoredBars([
      { t: "2026-07-31T04:00:00Z", o: 566.01, h: 568.44, l: 564.72, c: 567.19, v: 44117800 },
      { t: "2026-07-29T04:00:00Z", o: 561.23, h: 564.8, l: 559.11, c: 563.47, v: 41230100 },
      { t: "2026-07-30T04:00:00Z", o: 563.9, h: 566.12, l: 562.05, c: 565.88, v: 38904500 }
    ]);

    expect(mapped).toEqual(contract);
  });

  it("uses PascalCase keys the .NET deserializer matches case-sensitively", () => {
    const [bar] = toStoredBars([{ t: "2026-07-31T04:00:00Z", o: 1, h: 2, l: 0.5, c: 1.5, v: 100 }]);

    expect(Object.keys(bar)).toEqual(["Timestamp", "Open", "High", "Low", "Close", "Volume"]);
  });

  it("sorts ascending by timestamp regardless of feed order", () => {
    const mapped = toStoredBars([
      { t: "2026-07-31T04:00:00Z", o: 1, h: 1, l: 1, c: 1, v: 1 },
      { t: "2026-07-29T04:00:00Z", o: 1, h: 1, l: 1, c: 1, v: 1 }
    ]);

    expect(mapped.map(bar => bar.Timestamp)).toEqual([
      "2026-07-29T04:00:00Z",
      "2026-07-31T04:00:00Z"
    ]);
  });
});

describe("datasetKey", () => {
  it("matches the object name the API requests", () => {
    expect(datasetKey("QQQ")).toBe("QQQ-DAILY.json");
  });
});

describe("missedWeekdays", () => {
  // 2026-10-14 is a Wednesday.
  const wednesdayMidday = new Date("2026-10-14T15:00:00Z");

  it("counts nothing when yesterday's bar is in", () => {
    expect(missedWeekdays("2026-10-13T04:00:00Z", wednesdayMidday)).toBe(0);
  });

  it("does not count today, whose bar may not exist yet", () => {
    expect(missedWeekdays("2026-10-14T04:00:00Z", wednesdayMidday)).toBe(0);
  });

  it("skips the weekend between Friday's bar and Monday", () => {
    expect(missedWeekdays("2026-10-09T04:00:00Z", new Date("2026-10-12T15:00:00Z"))).toBe(0);
  });

  it("counts the weekdays a stalled dataset has missed", () => {
    // The 2026-10-06 bar seen on 2026-10-14: Oct 7, 8, 9, 12 and 13.
    expect(missedWeekdays("2026-10-06T04:00:00Z", wednesdayMidday)).toBe(5);
  });

  it("rejects a timestamp it cannot parse", () => {
    expect(() => missedWeekdays("not a date", wednesdayMidday)).toThrow(/Unparseable/);
  });
});

describe("isStale", () => {
  const tuesdayMidday = new Date("2026-10-13T15:00:00Z");

  it("allows one missed weekday, so a market holiday is not an alarm", () => {
    expect(isStale("2026-10-09T04:00:00Z", tuesdayMidday)).toBe(false);
  });

  it("reports two missed weekdays", () => {
    expect(isStale("2026-10-08T04:00:00Z", tuesdayMidday)).toBe(true);
  });
});

describe("staleDatasets", () => {
  const now = new Date("2026-10-14T15:00:00Z");

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function envWith(stored: Record<string, StoredBar[]>): Env {
    const datasets = new Map(Object.entries(stored));

    return {
      QUOTES: {
        get: vi.fn((key: string) => {
          const bars = datasets.get(key);
          return Promise.resolve(bars === undefined ? null : { json: () => Promise.resolve(bars) });
        })
      }
    } as unknown as Env;
  }

  function barAt(timestamp: string): StoredBar {
    return { Timestamp: timestamp, Open: 1, High: 1, Low: 1, Close: 1, Volume: 1 };
  }

  it("names only the symbols whose stored dataset has stopped advancing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const env = envWith({
      "SPY-DAILY.json": [barAt("2026-10-12T04:00:00Z"), barAt("2026-10-13T04:00:00Z")],
      "QQQ-DAILY.json": [barAt("2026-10-05T04:00:00Z"), barAt("2026-10-06T04:00:00Z")]
    });

    expect(await staleDatasets(env, ["SPY", "QQQ"], now)).toEqual(["QQQ"]);
  });

  it("treats a missing or empty dataset as stale", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const env = envWith({ "SPY-DAILY.json": [] });

    expect(await staleDatasets(env, ["SPY", "QQQ"], now)).toEqual(["SPY", "QQQ"]);
  });
});

describe("refreshQuotes", () => {
  // Wednesday 2026-10-14, mid-session.
  const now = new Date("2026-10-14T15:00:00Z");

  /** An R2 stub backed by a Map, so what a run writes is what it reads back. */
  function makeEnv(overrides?: Partial<Env>): { env: Env; stored: Map<string, string> } {
    const stored = new Map<string, string>();
    const env = {
      ALPACA_KEY: "key",
      ALPACA_SECRET: "secret",
      QUOTE_SYMBOLS: "SPY,QQQ",
      QUOTE_HISTORY_DAYS: "800",
      QUOTES: {
        put: vi.fn((key: string, body: string) => {
          stored.set(key, body);
          return Promise.resolve();
        }),
        get: vi.fn((key: string) => {
          const body = stored.get(key);
          return Promise.resolve(
            body === undefined ? null : { json: () => Promise.resolve(JSON.parse(body)) }
          );
        })
      },
      ...overrides
    } as unknown as Env;

    return { env, stored };
  }

  function alpacaBars(newestBySymbol: Record<string, string>): Response {
    const bars = Object.fromEntries(
      Object.entries(newestBySymbol).map(([symbol, t]) => [
        symbol,
        [{ t, o: 1, h: 1, l: 1, c: 1, v: 1 }]
      ])
    );
    return new Response(JSON.stringify({ bars, next_page_token: null }));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("resolves when every stored dataset is current", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(alpacaBars({ SPY: "2026-10-13T04:00:00Z", QQQ: "2026-10-14T04:00:00Z" }))
      )
    );
    const { env } = makeEnv();

    await expect(refreshQuotes(env)).resolves.toBeUndefined();
  });

  it("fails the run when a dataset has stopped advancing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(alpacaBars({ SPY: "2026-10-13T04:00:00Z", QQQ: "2026-10-06T04:00:00Z" }))
      )
    );
    const { env } = makeEnv();

    await expect(refreshQuotes(env)).rejects.toThrow("Quote dataset(s) not advancing for: QQQ");
  });

  it("judges a symbol the run skipped by what R2 already holds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(alpacaBars({ SPY: "2026-10-13T04:00:00Z" })))
    );
    const { env, stored } = makeEnv();
    stored.set(
      "QQQ-DAILY.json",
      JSON.stringify([
        { Timestamp: "2026-10-06T04:00:00Z", Open: 1, High: 1, Low: 1, Close: 1, Volume: 1 }
      ])
    );

    await expect(refreshQuotes(env)).rejects.toThrow("not advancing for: QQQ");
  });

  it("reports a failed write before checking freshness", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(alpacaBars({ SPY: "2026-10-13T04:00:00Z", QQQ: "2026-10-14T04:00:00Z" }))
      )
    );
    const { env } = makeEnv();
    vi.mocked(env.QUOTES.put).mockRejectedValueOnce(new Error("R2 down"));

    await expect(refreshQuotes(env)).rejects.toThrow("Failed to refresh dataset(s) for: SPY");
    expect(env.QUOTES.get).not.toHaveBeenCalled();
  });

  it("skips the run, freshness check included, without credentials", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { env } = makeEnv({ ALPACA_KEY: undefined });

    await expect(refreshQuotes(env)).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(env.QUOTES.get).not.toHaveBeenCalled();
  });
});
