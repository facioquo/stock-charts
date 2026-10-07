import { afterEach, describe, expect, it, vi } from "vitest";

import { clearApiClientCache, createApiClient } from "./client";
import { fetchOfflineSnapshot, offlineSnapshotPath } from "./offline";
import { createOfflineSnapshot } from "./snapshot";
import type { IndicatorListing } from "../config/types";

const API = "https://api.example.com";
const SNAPSHOT = "https://site.example/chart-api";

function listing(uiid: string, endpoint: string, defaultValue?: number): IndicatorListing {
  return {
    name: uiid,
    uiid,
    legendTemplate: uiid,
    endpoint,
    category: "moving-average",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters:
      defaultValue === undefined
        ? []
        : [
            {
              paramName: "lookbackPeriods",
              displayName: "Lookback",
              dataType: "int",
              minimum: 1,
              maximum: 250,
              defaultValue
            }
          ],
    results: []
  };
}

const quotes = [
  { timestamp: "2024-01-02T00:00:00.000Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 }
];
const catalog = [listing("SMA", `${API}/SMA/`, 20), listing("OBV", `${API}/OBV/`)];

/** A fetch stub serving fixed JSON bodies by URL; any other URL rejects like a dead origin. */
function serve(routes: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = input instanceof URL ? input.href : input instanceof Request ? input.url : input;
      if (!(url in routes)) return Promise.reject(new TypeError(`unreachable: ${url}`));
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: () => null },
        json: () => Promise.resolve(routes[url])
      } as unknown as Response);
    })
  );
}

/** Stubs `sessionStorage` for the stale cache, seeded with `{ [requestUrl]: body }`. */
function stubSession(seed: Record<string, unknown> = {}): void {
  const store = new Map(
    Object.entries(seed).map(([url, body]) => [`indy-charts:stale:${url}`, JSON.stringify(body)])
  );
  vi.stubGlobal("sessionStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value)
  });
}

const smaSelection = {
  ucid: "u",
  uiid: "SMA",
  label: "SMA",
  chartType: "overlay" as const,
  params: [{ paramName: "lookbackPeriods", displayName: "L", minimum: 1, maximum: 9, value: 20 }],
  results: []
};

afterEach(() => {
  clearApiClientCache();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("offlineSnapshotPath", () => {
  it("maps endpoints without a query to <path>.json", () => {
    expect(offlineSnapshotPath(API, `${API}/quotes`)).toBe("quotes.json");
    expect(offlineSnapshotPath(API, `${API}/SMA/`)).toBe("SMA.json");
  });

  it("folds sorted, encoded parameters into the file name", () => {
    expect(offlineSnapshotPath(API, `${API}/SMA/?lookbackPeriods=20`)).toBe(
      "SMA/lookbackPeriods=20.json"
    );
    expect(offlineSnapshotPath(API, `${API}/MACD/?slowPeriods=26&fastPeriods=12`)).toBe(
      "MACD/fastPeriods=12&slowPeriods=26.json"
    );
  });

  it("writes no percent signs or asterisks, and keeps distinct values distinct", () => {
    const paths = ["1e+21", "a b", "a,b", "a/b", "50%", "~", "%7E", "*", "a~7Eb", "+", "~2B"].map(
      value => offlineSnapshotPath(API, `${API}/SMA/?k=${encodeURIComponent(value)}`)
    );

    expect(paths.every(path => !/[%*]/.test(path))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths[0]).toBe("SMA/k=1e~2B21.json");
  });

  it("does not depend on where the API is mounted", () => {
    expect(offlineSnapshotPath("https://host.example/v1/", "https://host.example/v1/SMA/")).toBe(
      "SMA.json"
    );
  });
});

describe("fetchOfflineSnapshot", () => {
  it("reads the file the client would fall back to, with no request to the API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve([{ a: 1 }]) });
    vi.stubGlobal("fetch", fetchMock);

    const body = await fetchOfflineSnapshot(SNAPSHOT, API, `${API}/SMA/?lookbackPeriods=20`);

    expect(body).toEqual([{ a: 1 }]);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(`${SNAPSHOT}/SMA/lookbackPeriods=20.json`);
  });

  it("resolves to undefined when the file is missing or unreadable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    expect(await fetchOfflineSnapshot(SNAPSHOT, API, `${API}/quotes`)).toBeUndefined();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    expect(await fetchOfflineSnapshot(SNAPSHOT, API, `${API}/quotes`)).toBeUndefined();
  });
});

describe("offlineFallback", () => {
  it("serves quotes, listings, and selection data from the snapshot when the API is down", async () => {
    serve({
      [`${SNAPSHOT}/quotes.json`]: quotes,
      [`${SNAPSHOT}/indicators.json`]: catalog,
      [`${SNAPSHOT}/SMA/lookbackPeriods=20.json`]: [{ timestamp: "x", sma: 1 }]
    });
    const onOffline = vi.fn<(context: string) => void>();
    const onStale = vi.fn();
    const onError = vi.fn<(context: string, error: unknown) => void>();
    stubSession();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      staleCache: true,
      offlineFallback: { baseUrl: `${SNAPSHOT}/` },
      onOffline,
      onStale,
      onError
    });

    expect((await client.getQuotes())[0]?.close).toBe(1.5);
    expect(await client.getListings()).toHaveLength(2);
    const selection = {
      ucid: "u",
      uiid: "SMA",
      label: "SMA",
      chartType: "overlay" as const,
      params: [
        { paramName: "lookbackPeriods", displayName: "L", minimum: 1, maximum: 9, value: 20 }
      ],
      results: []
    };
    expect(await client.getSelectionData(selection, catalog[0])).toHaveLength(1);

    expect(onOffline.mock.calls.map(([context]) => context)).toEqual([
      "quotes",
      "listings",
      "selection data"
    ]);
    expect(onError.mock.calls.map(([context]) => context)).toEqual([
      "Error fetching quotes",
      "Error fetching listings",
      "Error fetching selection data"
    ]);
    expect(onStale).not.toHaveBeenCalled();
  });

  it("prefers the session stale cache over the snapshot", async () => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value)
    });
    store.set(`indy-charts:stale:${API}/quotes`, JSON.stringify(quotes));
    serve({ [`${SNAPSHOT}/quotes.json`]: [{ ...quotes[0], close: 99 }] });
    const onOffline = vi.fn();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      staleCache: true,
      offlineFallback: { baseUrl: SNAPSHOT },
      onOffline
    });

    expect((await client.getQuotes())[0]?.close).toBe(1.5);
    expect(onOffline).not.toHaveBeenCalled();
  });

  it("rethrows the live error when the snapshot file is missing or unreachable", async () => {
    serve({});
    const onOffline = vi.fn();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: "/chart-api" },
      onOffline
    });

    await expect(client.getQuotes()).rejects.toThrow("unreachable");
    expect(onOffline).not.toHaveBeenCalled();
  });

  it("rethrows the live error when the snapshot body is malformed", async () => {
    serve({ [`${SNAPSHOT}/quotes.json`]: { notAnArray: true } });
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT }
    });

    await expect(client.getQuotes()).rejects.toThrow("unreachable");
  });

  const reads = [
    {
      name: "quotes",
      live: `${API}/quotes`,
      file: `${SNAPSHOT}/quotes.json`,
      good: quotes,
      run: (client: ReturnType<typeof createApiClient>) => client.getQuotes()
    },
    {
      name: "listings",
      live: `${API}/indicators`,
      file: `${SNAPSHOT}/indicators.json`,
      good: catalog,
      run: (client: ReturnType<typeof createApiClient>) => client.getListings()
    },
    {
      name: "selection data",
      live: `${API}/SMA/?lookbackPeriods=20`,
      file: `${SNAPSHOT}/SMA/lookbackPeriods=20.json`,
      good: [{ timestamp: "x", sma: 1 }],
      run: (client: ReturnType<typeof createApiClient>) =>
        client.getSelectionData(smaSelection, catalog[0])
    }
  ];

  describe.each(reads)("$name", ({ live, file, good, run }) => {
    const make = (extra: Partial<Parameters<typeof createApiClient>[0]> = {}) => {
      const onError = vi.fn();
      const onOffline = vi.fn();
      const onStale = vi.fn();
      const client = createApiClient({
        baseUrl: API,
        retry: false,
        staleCache: true,
        offlineFallback: { baseUrl: SNAPSHOT },
        onError,
        onOffline,
        onStale,
        ...extra
      });
      return { client, onError, onOffline, onStale };
    };

    it("rethrows the live error when the snapshot file is missing", async () => {
      serve({});
      stubSession();
      const { client, onError, onOffline } = make();

      await expect(run(client)).rejects.toThrow("unreachable");
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onOffline).not.toHaveBeenCalled();
    });

    it("rethrows the live error when the snapshot body is malformed", async () => {
      serve({ [file]: { notAnArray: true } });
      stubSession();
      const { client, onOffline } = make();

      await expect(run(client)).rejects.toThrow("unreachable");
      expect(onOffline).not.toHaveBeenCalled();
    });

    it("prefers the stale cache over the snapshot", async () => {
      serve({ [file]: good });
      stubSession({ [live]: good });
      const { client, onStale, onOffline } = make();

      await run(client);
      expect(onStale).toHaveBeenCalledTimes(1);
      expect(onOffline).not.toHaveBeenCalled();
    });
  });

  it("falls back on an HTTP error status and reports the live error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input instanceof Request ? input.url : input);
        const ok = url === `${SNAPSHOT}/quotes.json`;
        return Promise.resolve({
          ok,
          status: ok ? 200 : 503,
          statusText: ok ? "OK" : "Service Unavailable",
          headers: { get: () => null },
          json: () => Promise.resolve(quotes)
        } as unknown as Response);
      })
    );
    const onError = vi.fn();
    const onOffline = vi.fn();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT },
      onError,
      onOffline
    });

    await expect(client.getQuotes()).resolves.toHaveLength(1);
    expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
    expect(onOffline).toHaveBeenCalledWith("quotes");
  });

  it("rethrows the live error when the snapshot answers 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input instanceof Request ? input.url : input);
        const live = url.startsWith(API);
        return live
          ? Promise.reject(new TypeError("live down"))
          : Promise.resolve({
              ok: false,
              status: 404,
              statusText: "Not Found",
              headers: { get: () => null },
              json: () => Promise.resolve({})
            } as unknown as Response);
      })
    );
    const onError = vi.fn();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT },
      onError
    });

    await expect(client.getQuotes()).rejects.toThrow("live down");
    expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(TypeError));
  });

  it("is inert while the live API answers", async () => {
    serve({ [`${API}/quotes`]: quotes, [`${SNAPSHOT}/quotes.json`]: [] });
    const onOffline = vi.fn();
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT },
      onOffline
    });

    expect(await client.getQuotes()).toHaveLength(1);
    expect(onOffline).not.toHaveBeenCalled();
  });
});

describe("createOfflineSnapshot", () => {
  it("round-trips: the files it writes are the files the fallback reads", async () => {
    // Build time: the live API answers.
    serve({
      [`${API}/quotes`]: quotes,
      [`${API}/indicators`]: catalog,
      [`${API}/SMA/?lookbackPeriods=20`]: [{ timestamp: "x", sma: 1 }],
      [`${API}/OBV/`]: [{ timestamp: "x", obv: 5 }]
    });
    const files = await createOfflineSnapshot({ baseUrl: API, retry: false });

    expect(files.map(file => file.path).sort()).toEqual([
      "OBV.json",
      "SMA/lookbackPeriods=20.json",
      "indicators.json",
      "quotes.json"
    ]);

    // Run time: the origin is gone and only the snapshot is served.
    clearApiClientCache();
    serve(Object.fromEntries(files.map(file => [`${SNAPSHOT}/${file.path}`, file.data])));
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT }
    });

    const listings = await client.getListings();
    expect(listings.map(item => item.uiid)).toEqual(["SMA", "OBV"]);
    for (const item of listings) {
      const selection = {
        ucid: item.uiid,
        uiid: item.uiid,
        label: item.uiid,
        chartType: item.chartType,
        params: item.parameters.map(p => ({
          paramName: p.paramName,
          displayName: p.displayName,
          minimum: p.minimum,
          maximum: p.maximum,
          value: p.defaultValue
        })),
        results: []
      };
      expect((await client.getSelectionData(selection, item)).length).toBeGreaterThan(0);
    }
    expect((await client.getQuotes())[0]?.close).toBe(1.5);
  });

  it("reads and writes snapshot files under custom endpoint paths", async () => {
    const endpoints = { quotes: "v2/market/quotes", indicators: "v2/market/indicators" };
    serve({
      [`${API}/v2/market/quotes`]: quotes,
      [`${API}/v2/market/indicators`]: [listing("OBV", `${API}/OBV/`)],
      [`${API}/OBV/`]: [{ timestamp: "x", obv: 5 }]
    });
    const files = await createOfflineSnapshot({ baseUrl: API, endpoints, retry: false });
    expect(files.map(file => file.path).sort()).toEqual([
      "OBV.json",
      "v2/market/indicators.json",
      "v2/market/quotes.json"
    ]);

    clearApiClientCache();
    serve(Object.fromEntries(files.map(file => [`${SNAPSHOT}/${file.path}`, file.data])));
    const client = createApiClient({
      baseUrl: API,
      endpoints,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT }
    });
    expect((await client.getQuotes())[0]?.close).toBe(1.5);
    expect((await client.getListings()).map(item => item.uiid)).toEqual(["OBV"]);
  });

  it("builds only from live responses, ignoring a shared fallback config", async () => {
    // A shared config at build time: stale cache seeded, snapshot served, live API down.
    serve({
      [`${SNAPSHOT}/quotes.json`]: quotes,
      [`${SNAPSHOT}/indicators.json`]: catalog
    });
    stubSession({ [`${API}/quotes`]: quotes, [`${API}/indicators`]: catalog });
    const onOffline = vi.fn();
    const onStale = vi.fn();

    await expect(
      createOfflineSnapshot(
        {
          baseUrl: API,
          retry: false,
          staleCache: true,
          offlineFallback: { baseUrl: SNAPSHOT },
          onOffline,
          onStale
        },
        { selections: [] }
      )
    ).rejects.toThrow("unreachable");
    expect(onOffline).not.toHaveBeenCalled();
    expect(onStale).not.toHaveBeenCalled();
  });

  it("round-trips a parameter value that a host would decode", async () => {
    const wide = listing("WIDE", `${API}/WIDE/`, 1e21);
    serve({
      [`${API}/quotes`]: quotes,
      [`${API}/indicators`]: [wide],
      [`${API}/WIDE/?lookbackPeriods=1e%2B21`]: [{ timestamp: "x", wide: 1 }]
    });
    const files = await createOfflineSnapshot({ baseUrl: API, retry: false });
    clearApiClientCache();

    // A static host decodes the request path before it looks for the file.
    const onDisk = new Map(files.map(file => [file.path, file.data]));
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input instanceof Request ? input.url : input);
        const path = decodeURIComponent(url.replace(`${SNAPSHOT}/`, ""));
        const data = onDisk.get(path);
        return url.startsWith(SNAPSHOT) && data !== undefined
          ? Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve(data)
            } as Response)
          : Promise.reject(new TypeError(`unreachable: ${url}`));
      })
    );
    const client = createApiClient({
      baseUrl: API,
      retry: false,
      offlineFallback: { baseUrl: SNAPSHOT }
    });
    const selection = {
      ...smaSelection,
      uiid: "WIDE",
      params: [{ ...smaSelection.params[0], maximum: 1e22, value: 1e21 }]
    };

    expect(await client.getSelectionData(selection, wide)).toHaveLength(1);
  });

  it("captures explicit selections and rejects one with no catalog listing", async () => {
    serve({
      [`${API}/quotes`]: quotes,
      [`${API}/indicators`]: catalog,
      [`${API}/SMA/?lookbackPeriods=200`]: [{ timestamp: "x", sma: 2 }]
    });
    const sma = {
      ucid: "u",
      uiid: "SMA",
      label: "SMA",
      chartType: "overlay" as const,
      params: [
        { paramName: "lookbackPeriods", displayName: "L", minimum: 1, maximum: 250, value: 200 }
      ],
      results: []
    };

    const files = await createOfflineSnapshot(
      { baseUrl: API, retry: false },
      { selections: [sma] }
    );
    expect(files.map(file => file.path)).toContain("SMA/lookbackPeriods=200.json");

    await expect(
      createOfflineSnapshot(
        { baseUrl: API, retry: false },
        { selections: [{ ...sma, uiid: "NOPE" }] }
      )
    ).rejects.toThrow('No catalog listing for selection "NOPE"');
  });
});
