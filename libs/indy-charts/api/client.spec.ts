import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";
import {
  BATCH_REFUSED,
  BATCH_SIZE,
  clearApiClientCache,
  createApiClient,
  peekCachedListings
} from "./client";
import type { ApiClient, RetryConfig } from "./client";
import type { IndicatorListing, IndicatorParam, IndicatorSelection } from "../config/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.example.com";

// Quote and listing responses are shared module-wide; isolate every test.
beforeEach(() => {
  clearApiClientCache();
});

type ApiQuote = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function createQuote(dateStr: string, close = 100): ApiQuote {
  return {
    timestamp: dateStr,
    open: close - 1,
    high: close + 1,
    low: close - 2,
    close,
    volume: 1000
  };
}

function makeListing(overrides?: Partial<IndicatorListing>): IndicatorListing {
  return {
    name: "SMA",
    uiid: "SMA",
    legendTemplate: "SMA({0})",
    endpoint: "sma",
    category: "overlay",
    chartType: "overlay",
    order: 1,
    chartConfig: null,
    parameters: [],
    results: [],
    ...overrides
  };
}

function makeSelection(params: IndicatorParam[] = []): IndicatorSelection {
  return {
    ucid: "SMA-1",
    uiid: "SMA",
    label: "SMA(20)",
    chartType: "overlay",
    params,
    results: []
  };
}

function makeParam(name: string, value?: number): IndicatorParam {
  return {
    paramName: name,
    displayName: name,
    minimum: 1,
    maximum: 999,
    value
  };
}

// ---------------------------------------------------------------------------
// Mock fetch helper
// ---------------------------------------------------------------------------

function mockFetchOk(body: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
      status: 200,
      statusText: "OK",
      headers: { get: (_: string): string | null => null }
    })
  );
}

function mockFetchError(status: number, statusText: string): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
      status,
      statusText,
      headers: { get: (_: string): string | null => null }
    })
  );
}

function mockFetchNetworkError(message: string): void {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(message)));
}

interface MockResponse {
  status: number;
  body?: unknown;
  retryAfter?: string;
}

/** Stubs fetch to return each response in sequence; last response is repeated. */
function mockFetchSequence(responses: MockResponse[]): ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  responses.forEach(r => {
    fn.mockResolvedValueOnce({
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      statusText: r.status >= 200 && r.status < 300 ? "OK" : "Error",
      headers: {
        get: (h: string): string | null =>
          h === "Retry-After" && r.retryAfter ? r.retryAfter : null
      },
      json: () => Promise.resolve(r.body ?? {})
    });
  });
  const last = responses[responses.length - 1];
  fn.mockResolvedValue({
    ok: last.status >= 200 && last.status < 300,
    status: last.status,
    statusText: last.status >= 200 && last.status < 300 ? "OK" : "Error",
    headers: { get: (_: string): string | null => null },
    json: () => Promise.resolve(last.body ?? {})
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** Returns a minimal mock for sessionStorage; safe in Node (no real browser storage). */
function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    }
  };
}

/** Retry config that disables artificial delays so tests run instantly. */
const NO_DELAY_RETRY: RetryConfig = { maxAttempts: 3, baseDelayMs: 0 };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createApiClient", () => {
  let client: ApiClient;
  let onError: Mock<(context: string, error: unknown) => void>;

  beforeEach(() => {
    onError = vi.fn<(context: string, error: unknown) => void>();
    // Disable retries by default so error-handling tests remain fast.
    // Retry-specific behaviour is covered in the "retry" describe block below.
    client = createApiClient({
      baseUrl: BASE_URL,
      onError,
      retry: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -----------------------------------------------------------------------
  // baseUrl normalisation
  // -----------------------------------------------------------------------

  describe("baseUrl normalisation", () => {
    it("appends trailing slash when missing", async () => {
      mockFetchOk([]);
      const c = createApiClient({ baseUrl: "https://host.com" });
      await c.getQuotes();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith("https://host.com/quotes");
    });

    it("keeps trailing slash when present", async () => {
      mockFetchOk([]);
      const c = createApiClient({ baseUrl: "https://host.com/" });
      await c.getQuotes();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith("https://host.com/quotes");
    });
  });

  // -----------------------------------------------------------------------
  // getQuotes
  // -----------------------------------------------------------------------

  describe("getQuotes", () => {
    it("returns Bar[] with Date objects from raw ISO strings", async () => {
      const apiQuotes: ApiQuote[] = [
        createQuote("2024-01-01T00:00:00Z"),
        createQuote("2024-01-02T00:00:00Z")
      ];
      mockFetchOk(apiQuotes);

      const quotes = await client.getQuotes();

      expect(quotes).toHaveLength(2);
      const firstTimestamp = quotes[0].timestamp;
      expect(firstTimestamp).toBeInstanceOf(Date);
      expect((firstTimestamp as Date).toISOString()).toBe("2024-01-01T00:00:00.000Z");
      expect(quotes[1].close).toBe(100);
    });

    it("calls fetch with correct URL", async () => {
      mockFetchOk([]);
      await client.getQuotes();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(`${BASE_URL}/quotes`);
    });

    it("returns empty array when API returns empty", async () => {
      mockFetchOk([]);
      const quotes = await client.getQuotes();
      expect(quotes).toEqual([]);
    });

    it("throws and calls onError when a quote date is invalid", async () => {
      mockFetchOk([createQuote("not-a-date")]);

      await expect(client.getQuotes()).rejects.toThrow(
        'Invalid quote date at index 0: "not-a-date"'
      );
      expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
    });

    it("throws when a quote element is null or non-object", async () => {
      mockFetchOk([null]);
      await expect(client.getQuotes()).rejects.toThrow(
        "Invalid quote at index 0: expected object, got object"
      );

      mockFetchOk(["not-an-object"]);
      await expect(client.getQuotes()).rejects.toThrow(
        "Invalid quote at index 0: expected object, got string"
      );
    });

    it("throws when response is not an array", async () => {
      mockFetchOk({ notAnArray: true });
      await expect(client.getQuotes()).rejects.toThrow(
        "Invalid quotes response: expected an array"
      );
    });

    it("throws and calls onError on HTTP error", async () => {
      mockFetchError(500, "Internal Server Error");

      await expect(client.getQuotes()).rejects.toThrow("HTTP 500: Internal Server Error");
      expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
    });

    it("throws and calls onError on network error", async () => {
      mockFetchNetworkError("Network failure");

      await expect(client.getQuotes()).rejects.toThrow("Network failure");
      expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
    });

    it("preserves all OHLCV fields", async () => {
      const apiQuotes: ApiQuote[] = [
        { timestamp: "2024-06-15T00:00:00Z", open: 10, high: 20, low: 5, close: 15, volume: 9999 }
      ];
      mockFetchOk(apiQuotes);

      const [q] = await client.getQuotes();
      expect(q).toMatchObject({
        open: 10,
        high: 20,
        low: 5,
        close: 15,
        volume: 9999
      });
    });
  });

  // -----------------------------------------------------------------------
  // getListings
  // -----------------------------------------------------------------------

  describe("getListings", () => {
    it("returns listings from /indicators endpoint", async () => {
      const listings = [makeListing({ name: "SMA" }), makeListing({ name: "EMA" })];
      mockFetchOk(listings);

      const result = await client.getListings();
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("SMA");
      expect(result[1].name).toBe("EMA");
    });

    it("calls fetch with correct URL", async () => {
      mockFetchOk([]);
      await client.getListings();
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(`${BASE_URL}/indicators`);
    });

    it("uses configured endpoint overrides", async () => {
      mockFetchOk([]);
      const c = createApiClient({
        baseUrl: BASE_URL,
        endpoints: { quotes: "api/quotes", indicators: "api/indicators" }
      });

      await c.getQuotes();
      await c.getListings();

      expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(1, `${BASE_URL}/api/quotes`);
      expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(2, `${BASE_URL}/api/indicators`);
    });

    it("throws and calls onError on HTTP error", async () => {
      mockFetchError(404, "Not Found");

      await expect(client.getListings()).rejects.toThrow("HTTP 404: Not Found");
      expect(onError).toHaveBeenCalledWith("Error fetching listings", expect.any(Error));
    });

    it("throws and calls onError on network error", async () => {
      mockFetchNetworkError("DNS lookup failed");

      await expect(client.getListings()).rejects.toThrow("DNS lookup failed");
      expect(onError).toHaveBeenCalledWith("Error fetching listings", expect.any(Error));
    });

    it("normalizes pivot points metadata for segmented level rendering", async () => {
      const listings = [
        makeListing({
          uiid: "PIVOT-POINTS",
          results: [
            {
              displayName: "R1",
              tooltipTemplate: "R1",
              dataName: "r1",
              dataType: "number",
              lineType: "solid",
              stack: "",
              lineWidth: 2,
              defaultColor: "#000000"
            }
          ]
        })
      ];
      mockFetchOk(listings);

      const [pivot] = await client.getListings();
      const [r1] = pivot.results;

      expect(r1.lineType).toBe("dash");
      expect(r1.lineWidth).toBe(1);
      expect(r1.segmented).toBe(true);
      expect(r1.segmentMode).toBe("step");
      expect(r1.defaultColor).toBe("#DD2C00");
    });

    it("normalizes standard deviation channels metadata for slope segmentation", async () => {
      const listings = [
        makeListing({
          uiid: "STDEV-CH",
          results: [
            {
              displayName: "Centerline",
              tooltipTemplate: "Centerline",
              dataName: "centerline",
              dataType: "number",
              lineType: "solid",
              stack: "",
              lineWidth: 2,
              defaultColor: "#000000"
            }
          ]
        })
      ];
      mockFetchOk(listings);

      const [stdev] = await client.getListings();
      const [center] = stdev.results;

      expect(center.lineType).toBe("dash");
      expect(center.segmented).toBe(true);
      expect(center.segmentMode).toBe("slope");
      expect(center.defaultColor).toBe("#EF6C00");
    });

    it("normalizes Bollinger and rolling pivots line styles", async () => {
      const listings = [
        makeListing({
          uiid: "BB",
          results: [
            {
              displayName: "Centerline",
              tooltipTemplate: "Centerline",
              dataName: "sma",
              dataType: "number",
              lineType: "solid",
              stack: "",
              lineWidth: 2,
              defaultColor: "#000000"
            }
          ]
        }),
        makeListing({
          uiid: "ROLLING-PIVOTS",
          results: [
            {
              displayName: "R2",
              tooltipTemplate: "R2",
              dataName: "r2",
              dataType: "number",
              lineType: "solid",
              stack: "",
              lineWidth: 2,
              defaultColor: "#000000"
            }
          ]
        })
      ];
      mockFetchOk(listings);

      const [bb, rolling] = await client.getListings();

      expect(bb.results[0].lineType).toBe("dash");
      expect(bb.results[0].lineWidth).toBe(1);
      expect(bb.results[0].defaultColor).toBe("#EF6C00");

      expect(rolling.results[0].lineType).toBe("dash");
      expect(rolling.results[0].lineWidth).toBe(1);
      expect(rolling.results[0].segmented).toBe(false);
      expect(rolling.results[0].defaultColor).toBe("#DD2C00");
    });
  });

  // -----------------------------------------------------------------------
  // getSelectionData
  // -----------------------------------------------------------------------

  describe("getSelectionData", () => {
    it("calls endpoint with correct base URL", async () => {
      mockFetchOk([]);
      const listing = makeListing({ endpoint: "sma" });
      const selection = makeSelection([]);

      await client.getSelectionData(selection, listing);

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`${BASE_URL}/sma`);
    });

    it("appends params as query string", async () => {
      mockFetchOk([]);
      const listing = makeListing({ endpoint: "sma" });
      const selection = makeSelection([makeParam("lookbackPeriods", 20), makeParam("smaType", 1)]);

      await client.getSelectionData(selection, listing);

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get("lookbackPeriods")).toBe("20");
      expect(url.searchParams.get("smaType")).toBe("1");
    });

    it("omits params with null/undefined values", async () => {
      mockFetchOk([]);
      const listing = makeListing({ endpoint: "sma" });
      const selection = makeSelection([
        makeParam("lookbackPeriods", 20),
        makeParam("optional") // value is undefined
      ]);

      await client.getSelectionData(selection, listing);

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get("lookbackPeriods")).toBe("20");
      expect(url.searchParams.has("optional")).toBe(false);
    });

    it("returns data array from API response", async () => {
      const data = [
        { timestamp: "2024-01-01", sma: 50.5 },
        { timestamp: "2024-01-02", sma: 51.0 }
      ];
      mockFetchOk(data);

      const result = await client.getSelectionData(
        makeSelection([]),
        makeListing({ endpoint: "sma" })
      );
      expect(result).toEqual(data);
    });

    it("throws and calls onError on HTTP error", async () => {
      mockFetchError(503, "Service Unavailable");

      await expect(client.getSelectionData(makeSelection([]), makeListing())).rejects.toThrow(
        "HTTP 503: Service Unavailable"
      );

      expect(onError).toHaveBeenCalledWith("Error fetching selection data", expect.any(Error));
    });

    it("throws and calls onError on network error", async () => {
      mockFetchNetworkError("Connection refused");

      await expect(client.getSelectionData(makeSelection([]), makeListing())).rejects.toThrow(
        "Connection refused"
      );

      expect(onError).toHaveBeenCalledWith("Error fetching selection data", expect.any(Error));
    });

    it("resolves nested endpoint paths correctly", async () => {
      mockFetchOk([]);
      const listing = makeListing({ endpoint: "v2/indicators/bollinger" });

      await client.getSelectionData(makeSelection([]), listing);

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("v2/indicators/bollinger");
    });
  });

  // -----------------------------------------------------------------------
  // onError callback behaviour
  // -----------------------------------------------------------------------

  describe("getSelectionsData", () => {
    const requests = [
      {
        selection: makeSelection([makeParam("lookbackPeriods", 20)]),
        listing: makeListing({ endpoint: "SMA/" })
      },
      {
        selection: makeSelection([makeParam("lookbackPeriods", 14)]),
        listing: makeListing({ endpoint: "RSI/" })
      }
    ];
    const batchCalls = (): string[] =>
      vi
        .mocked(fetch)
        .mock.calls.map(([url]) => (typeof url === "string" ? url : ""))
        .filter(url => url.includes("/indicators/batch"));

    it("answers every selection from one batch request", async () => {
      mockFetchOk([
        { status: 200, data: [{ a: 1 }] },
        { status: 200, data: [{ b: 2 }] }
      ]);

      const rows = await Promise.all(client.getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }]]);
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
      const url = new URL(batchCalls()[0] ?? "");
      expect(url.pathname).toBe("/indicators/batch");
      expect(url.searchParams.getAll("s")).toEqual([
        "SMA?lookbackPeriods=20",
        "RSI?lookbackPeriods=14"
      ]);
    });

    it("requests a selection alone when its batch item failed", async () => {
      const fetchMock = mockFetchSequence([
        {
          status: 207,
          body: [
            { status: 200, data: [{ a: 1 }] },
            { status: 400, error: "bad" }
          ]
        },
        { status: 200, body: [{ b: 2 }] }
      ]);

      const rows = await Promise.all(client.getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }]]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/RSI/?lookbackPeriods=14");
    });

    it("falls back to one request per selection on a 404, and does not ask again", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) =>
          Promise.resolve({
            ok: !url.includes("/indicators/batch"),
            status: url.includes("/indicators/batch") ? 404 : 200,
            statusText: "",
            headers: { get: () => null },
            json: () => Promise.resolve([{ ok: 1 }])
          } as unknown as Response)
        )
      );

      const first = await Promise.all(client.getSelectionsData(requests));
      expect(first).toEqual([[{ ok: 1 }], [{ ok: 1 }]]);
      expect(batchCalls()).toHaveLength(1);

      await Promise.all(client.getSelectionsData(requests));
      expect(batchCalls()).toHaveLength(1);
    });

    it("splits a long list into batch requests no larger than the server cap, keeping every row with its selection", async () => {
      const many = Array.from({ length: 25 }, (_, i) => ({
        selection: makeSelection([makeParam("lookbackPeriods", i + 1)]),
        listing: makeListing({ endpoint: "SMA/" })
      }));
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) => {
          const asked = new URL(url).searchParams.getAll("s");
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "",
            headers: { get: () => null },
            json: () => Promise.resolve(asked.map(name => ({ status: 200, data: [{ name }] })))
          } as unknown as Response);
        })
      );

      const rows = await Promise.all(client.getSelectionsData(many));

      expect(rows.map(row => (row as Array<{ name: string }>)[0]?.name)).toEqual(
        many.map((_, i) => `SMA?lookbackPeriods=${i + 1}`)
      );
      expect(batchCalls().map(url => new URL(url).searchParams.getAll("s").length)).toEqual([
        BATCH_SIZE,
        5
      ]);
    });

    it.each([...BATCH_REFUSED])("stops asking for the batch after a %i", async status => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) =>
          Promise.resolve({
            ok: !url.includes("/indicators/batch"),
            status: url.includes("/indicators/batch") ? status : 200,
            statusText: "",
            headers: { get: () => null },
            json: () => Promise.resolve([{ ok: 1 }])
          } as unknown as Response)
        )
      );

      await Promise.all(client.getSelectionsData(requests));
      await Promise.all(client.getSelectionsData(requests));

      expect(batchCalls()).toHaveLength(1);
    });

    it.each([429, 503])("keeps asking for the batch after a transient %i", async status => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string) =>
          Promise.resolve({
            ok: !url.includes("/indicators/batch"),
            status: url.includes("/indicators/batch") ? status : 200,
            statusText: "",
            headers: { get: () => null },
            json: () => Promise.resolve([{ ok: 1 }])
          } as unknown as Response)
        )
      );

      await Promise.all(client.getSelectionsData(requests));
      await Promise.all(client.getSelectionsData(requests));

      expect(batchCalls()).toHaveLength(2);
    });

    it("requests the batch at endpoints.batch when it is overridden", async () => {
      const custom = createApiClient({
        baseUrl: BASE_URL,
        endpoints: { batch: "v2/batch" },
        retry: false
      });
      mockFetchOk([
        { status: 200, data: [{ a: 1 }] },
        { status: 200, data: [{ b: 2 }] }
      ]);

      await Promise.all(custom.getSelectionsData(requests));

      expect(new URL(String(vi.mocked(fetch).mock.calls[0]?.[0] as string)).pathname).toBe(
        "/v2/batch"
      );
    });

    it("keeps its cap and refusal set in step with the shared batch contract", () => {
      const contract = JSON.parse(
        readFileSync(
          resolve(dirname(fileURLToPath(import.meta.url)), "../../../server/batch.contract.json"),
          "utf8"
        )
      ) as { maxSelections: number; refusedStatuses: number[] };

      expect(BATCH_SIZE).toBe(contract.maxSelections);
      expect([...BATCH_REFUSED].sort()).toEqual([...contract.refusedStatuses].sort());
    });

    it("makes one attempt at the batch before falling back, even with retries on", async () => {
      const retrying = createApiClient({
        baseUrl: BASE_URL,
        retry: { maxAttempts: 3, baseDelayMs: 1 }
      });
      const fetchMock = mockFetchSequence([
        { status: 503, body: {} },
        { status: 200, body: [{ one: 1 }] },
        { status: 200, body: [{ two: 2 }] }
      ]);

      const rows = await Promise.all(retrying.getSelectionsData(requests));

      expect(rows).toEqual([[{ one: 1 }], [{ two: 2 }]]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("does not batch a single selection", async () => {
      mockFetchOk([{ ok: 1 }]);

      await Promise.all(client.getSelectionsData(requests.slice(0, 1)));

      expect(batchCalls()).toHaveLength(0);
    });

    it("falls back when the batch answer has the wrong length", async () => {
      const fetchMock = mockFetchSequence([
        { status: 200, body: [{ status: 200, data: [] }] },
        { status: 200, body: [{ one: 1 }] },
        { status: 200, body: [{ two: 2 }] }
      ]);

      const rows = await Promise.all(client.getSelectionsData(requests));

      expect(rows).toEqual([[{ one: 1 }], [{ two: 2 }]]);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe("onError callback", () => {
    it("works without onError callback (no error thrown)", async () => {
      mockFetchError(500, "Server Error");
      const c = createApiClient({ baseUrl: BASE_URL, retry: false });

      // Should still throw the HTTP error, just no callback
      await expect(c.getQuotes()).rejects.toThrow("HTTP 500: Server Error");
    });

    it("re-throws error after calling onError", async () => {
      mockFetchNetworkError("Timeout");

      const errorFromReject = await client.getQuotes().catch((e: unknown) => e);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(errorFromReject).toBeInstanceOf(Error);
    });
  });
});

// ---------------------------------------------------------------------------
// Retry behaviour
// ---------------------------------------------------------------------------

describe("retry", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("retries on 5xx and succeeds when a later attempt returns 200", async () => {
    const quotes = [
      { timestamp: "2024-01-01T00:00:00Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }
    ];
    const fn = mockFetchSequence([{ status: 503 }, { status: 503 }, { status: 200, body: quotes }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    const result = await client.getQuotes();

    expect(fn).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(1);
    expect(result[0].close).toBe(1.5);
  });

  it("retries on 429 and succeeds on the second attempt", async () => {
    const fn = mockFetchSequence([{ status: 429 }, { status: 200, body: [] }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    await client.getQuotes();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry on non-transient 4xx (e.g. 404)", async () => {
    const fn = mockFetchSequence([{ status: 404 }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    await expect(client.getQuotes()).rejects.toThrow("HTTP 404");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and succeeds on next attempt", async () => {
    const fn = vi.fn();
    fn.mockRejectedValueOnce(new Error("ECONNRESET"));
    fn.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([])
    });
    vi.stubGlobal("fetch", fn);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    await client.getQuotes();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting maxAttempts on persistent 5xx", async () => {
    const fn = mockFetchSequence([{ status: 500 }, { status: 500 }, { status: 500 }]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    });
    await expect(client.getQuotes()).rejects.toThrow("HTTP 500");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting maxAttempts on persistent network errors", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Connection refused"));
    vi.stubGlobal("fetch", fn);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 2, baseDelayMs: 0 }
    });
    await expect(client.getQuotes()).rejects.toThrow("Connection refused");

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("respects maxAttempts: 1 (no retries)", async () => {
    const fn = mockFetchSequence([{ status: 503 }, { status: 200, body: [] }]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 1, baseDelayMs: 0 }
    });
    await expect(client.getQuotes()).rejects.toThrow("HTTP 503");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("skips all retries when retry: false", async () => {
    const fn = mockFetchSequence([{ status: 503 }, { status: 200, body: [] }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: false });
    await expect(client.getQuotes()).rejects.toThrow("HTTP 503");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clamps Infinity maxAttempts to default (3 attempts)", async () => {
    const fn = mockFetchSequence([{ status: 500 }, { status: 500 }, { status: 500 }]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: Infinity, baseDelayMs: 0 }
    });
    await expect(client.getQuotes()).rejects.toThrow("HTTP 500");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("uses Retry-After header delay on 429 instead of back-off", async () => {
    vi.useFakeTimers();
    const fn = mockFetchSequence([
      { status: 429, retryAfter: "1" }, // 1 second
      { status: 200, body: [] }
    ]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 2, baseDelayMs: 9999 } // large backoff to prove it's NOT used
    });
    const promise = client.getQuotes();
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("clamps an oversized Retry-After header to the 30s ceiling", async () => {
    vi.useFakeTimers();
    const fn = mockFetchSequence([
      { status: 429, retryAfter: "999999" }, // ~11.5 days if honoured verbatim
      { status: 200, body: [] }
    ]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 2, baseDelayMs: 0 }
    });
    const promise = client.getQuotes();
    // Advancing by the ceiling alone must be enough to release the second attempt.
    await vi.advanceTimersByTimeAsync(30_000);
    await promise;

    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("caps the exponential back-off window at 30s for deep retries", async () => {
    vi.useFakeTimers();
    // Force jitter near the top of the window so the assertion is deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const fn = mockFetchSequence([{ status: 500 }, { status: 200, body: [] }]);

    // Uncapped, retryIndex 0 would wait ~9.99M ms; the ceiling must clamp it to ≤30s.
    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 2, baseDelayMs: 10_000_000 }
    });
    const promise = client.getQuotes();
    await vi.advanceTimersByTimeAsync(30_000);
    await promise;

    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("honours an HTTP-date Retry-After value on 429", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    // A large back-off would wait ~30s (capped); only the header delay is this short.
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const fn = mockFetchSequence([
      { status: 429, retryAfter: "Mon, 01 Jan 2024 00:00:02 GMT" }, // 2s in the future
      { status: 200, body: [] }
    ]);

    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 2, baseDelayMs: 10_000_000 }
    });
    const promise = client.getQuotes();
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("retries getListings on transient errors", async () => {
    const listing = makeListing({ name: "SMA" });
    const fn = mockFetchSequence([{ status: 502 }, { status: 200, body: [listing] }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    const result = await client.getListings();

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(1);
  });

  it("retries getSelectionData on transient errors", async () => {
    const rows = [{ timestamp: "2024-01-01", sma: 50 }];
    const fn = mockFetchSequence([{ status: 503 }, { status: 200, body: rows }]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: NO_DELAY_RETRY });
    const result = await client.getSelectionData(
      makeSelection([]),
      makeListing({ endpoint: "sma" })
    );

    expect(fn).toHaveBeenCalledTimes(2);
    expect(result).toEqual(rows);
  });
});

// ---------------------------------------------------------------------------
// Stale cache
// ---------------------------------------------------------------------------

describe("staleCache", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function setupStorage(): Storage {
    const storage = createMockStorage();
    vi.stubGlobal("sessionStorage", storage);
    return storage;
  }

  it("stores successful quotes in sessionStorage and returns them on failure", async () => {
    const onStale = vi.fn<(context: string) => void>();
    setupStorage();

    const quotes = [
      { timestamp: "2024-01-01T00:00:00Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }
    ];

    // First call: success → populates the cache
    mockFetchOk(quotes);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true, onStale });
    await client.getQuotes();

    // Second call: network failure → should serve from cache
    clearApiClientCache(); // drop the shared response so the next call refetches
    mockFetchNetworkError("Network down");
    const staleResult = await client.getQuotes();

    expect(staleResult).toHaveLength(1);
    expect(staleResult[0].close).toBe(1.5);
    expect(onStale).toHaveBeenCalledWith("quotes");
  });

  it("stores successful listings in sessionStorage and returns them on failure", async () => {
    const onStale = vi.fn<(context: string) => void>();
    setupStorage();

    const listings = [makeListing({ name: "SMA" })];

    mockFetchOk(listings);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true, onStale });
    await client.getListings();

    clearApiClientCache(); // drop the shared response so the next call refetches
    mockFetchNetworkError("Network down");
    const staleResult = await client.getListings();

    expect(staleResult).toHaveLength(1);
    expect(staleResult[0].name).toBe("SMA");
    expect(onStale).toHaveBeenCalledWith("listings");
  });

  it("stores successful selection data in sessionStorage and returns it on failure", async () => {
    const onStale = vi.fn<(context: string) => void>();
    setupStorage();

    const rows = [{ timestamp: "2024-01-01", sma: 42.0 }];

    mockFetchOk(rows);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true, onStale });
    await client.getSelectionData(makeSelection([]), makeListing({ endpoint: "sma" }));

    mockFetchNetworkError("Network down");
    const staleResult = await client.getSelectionData(
      makeSelection([]),
      makeListing({ endpoint: "sma" })
    );

    expect(staleResult).toEqual(rows);
    expect(onStale).toHaveBeenCalledWith("selection data");
  });

  it("throws and calls onError when staleCache is off (no fallback)", async () => {
    const onError = vi.fn<(context: string, error: unknown) => void>();
    setupStorage();

    const quotes = [
      { timestamp: "2024-01-01T00:00:00Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }
    ];

    mockFetchOk(quotes);
    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      staleCache: false,
      onError
    });
    await client.getQuotes(); // prime (no caching)

    clearApiClientCache(); // drop the shared response so the next call refetches
    mockFetchNetworkError("Network down");
    await expect(client.getQuotes()).rejects.toThrow("Network down");
    expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
  });

  it("does not call onStale on a successful fetch even when cache is populated", async () => {
    const onStale = vi.fn<(context: string) => void>();
    setupStorage();

    mockFetchOk([]);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true, onStale });

    await client.getQuotes(); // success
    await client.getQuotes(); // success again

    expect(onStale).not.toHaveBeenCalled();
  });

  it("gracefully handles unavailable sessionStorage (e.g. SSR)", async () => {
    const onStale = vi.fn<(context: string) => void>();
    // Simulate no sessionStorage (server-side rendering / Node)
    vi.stubGlobal("sessionStorage", undefined);

    mockFetchNetworkError("Network down");
    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true, onStale });

    await expect(client.getQuotes()).rejects.toThrow("Network down");
    expect(onStale).not.toHaveBeenCalled();
  });

  it("calls onError before returning stale data (not silently bypassed)", async () => {
    const onError = vi.fn<(context: string, error: unknown) => void>();
    const onStale = vi.fn<(context: string) => void>();
    setupStorage();

    const quotes = [
      { timestamp: "2024-01-01T00:00:00Z", open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }
    ];
    mockFetchOk(quotes);
    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      staleCache: true,
      onError,
      onStale
    });
    await client.getQuotes(); // populate cache

    clearApiClientCache(); // drop the shared response so the next call refetches
    mockFetchNetworkError("Network down");
    const staleResult = await client.getQuotes();

    expect(staleResult).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
    expect(onStale).toHaveBeenCalledWith("quotes");
  });

  it("surfaces original fetch error when cached selection data is not an array", async () => {
    const onError = vi.fn<(context: string, error: unknown) => void>();
    const onStale = vi.fn<(context: string) => void>();
    const storage = setupStorage();

    // Write a tampered (non-array) cache entry to simulate corruption.
    storage.setItem(`indy-charts:stale:${BASE_URL}/sma`, JSON.stringify({ notAnArray: true }));

    mockFetchNetworkError("Network down");
    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      staleCache: true,
      onError,
      onStale
    });

    await expect(
      client.getSelectionData(makeSelection([]), makeListing({ endpoint: "sma" }))
    ).rejects.toThrow("Network down");
    expect(onError).toHaveBeenCalledWith("Error fetching selection data", expect.any(Error));
    expect(onStale).not.toHaveBeenCalled();
  });

  it("surfaces original fetch error when cached data fails normalization", async () => {
    const onError = vi.fn<(context: string, error: unknown) => void>();
    const storage = setupStorage();

    // Write malformed quote data directly into the cache to simulate corruption.
    storage.setItem(`indy-charts:stale:${BASE_URL}/quotes`, JSON.stringify([{ invalid: true }]));

    mockFetchNetworkError("Network down");
    const client = createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      staleCache: true,
      onError
    });

    await expect(client.getQuotes()).rejects.toThrow("Network down");
    expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
  });
});

// ---------------------------------------------------------------------------
// Shared responses across clients
// ---------------------------------------------------------------------------

describe("shared responses", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("joins concurrent listings requests from separate clients into one fetch", async () => {
    mockFetchOk([makeListing()]);
    const first = createApiClient({ baseUrl: BASE_URL, retry: false });
    const second = createApiClient({ baseUrl: `${BASE_URL}/`, retry: false });

    const [a, b] = await Promise.all([first.getListings(), second.getListings()]);

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    // Each caller gets its own normalized copy, so one cannot mutate another's.
    expect(a).not.toBe(b);
    expect(a[0]).not.toBe(b[0]);
  });

  it("reuses a settled response until the cache is cleared", async () => {
    mockFetchOk([createQuote("2024-01-01T00:00:00Z")]);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false });

    await client.getQuotes();
    await createApiClient({ baseUrl: BASE_URL, retry: false }).getQuotes();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    clearApiClientCache();
    await client.getQuotes();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("keeps separate entries per resolved URL", async () => {
    mockFetchOk([makeListing()]);

    await createApiClient({ baseUrl: BASE_URL, retry: false }).getListings();
    await createApiClient({ baseUrl: "https://other.example.com", retry: false }).getListings();
    await createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      endpoints: { indicators: "catalog" }
    }).getListings();

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });

  it("does not keep a failed response, and reports it to every waiting client", async () => {
    const firstOnError = vi.fn<(context: string, error: unknown) => void>();
    const secondOnError = vi.fn<(context: string, error: unknown) => void>();
    mockFetchError(404, "Not Found");
    const first = createApiClient({ baseUrl: BASE_URL, retry: false, onError: firstOnError });
    const second = createApiClient({ baseUrl: BASE_URL, retry: false, onError: secondOnError });

    const results = await Promise.allSettled([first.getListings(), second.getListings()]);

    expect(results.map(r => r.status)).toEqual(["rejected", "rejected"]);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    expect(firstOnError).toHaveBeenCalledWith("Error fetching listings", expect.any(Error));
    expect(secondOnError).toHaveBeenCalledWith("Error fetching listings", expect.any(Error));

    mockFetchOk([makeListing()]);
    await expect(first.getListings()).resolves.toHaveLength(1);
  });

  it("does not keep a response body that fails validation", async () => {
    mockFetchOk({ notAnArray: true });
    const client = createApiClient({ baseUrl: BASE_URL, retry: false });
    await expect(client.getQuotes()).rejects.toThrow("expected an array");

    mockFetchOk([createQuote("2024-01-01T00:00:00Z")]);
    await expect(client.getQuotes()).resolves.toHaveLength(1);
  });

  it("writes the stale-cache copy once per shared response", async () => {
    const storage = createMockStorage();
    const setItem = vi.spyOn(storage, "setItem");
    vi.stubGlobal("sessionStorage", storage);
    mockFetchOk([makeListing()]);

    const client = createApiClient({ baseUrl: BASE_URL, retry: false, staleCache: true });
    await Promise.all([client.getListings(), client.getListings()]);
    await client.getListings();

    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it("does not let a request cleared mid-flight repopulate the cache", async () => {
    const resolvers: Array<() => void> = [];
    const okResponse = (body: unknown): Response =>
      ({
        ok: true,
        status: 200,
        statusText: "OK",
        headers: { get: (_: string): string | null => null },
        json: () => Promise.resolve(body)
      }) as unknown as Response;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        (): Promise<Response> =>
          new Promise(resolve => {
            resolvers.push(() => resolve(okResponse([makeListing({ uiid: "old" })])));
          })
      )
    );
    const client = createApiClient({ baseUrl: BASE_URL, retry: false });

    const cleared = client.getListings();
    clearApiClientCache();
    const current = client.getListings();
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

    resolvers[0]?.();
    await cleared;

    // The cleared request settles while its replacement is still pending.
    expect(peekCachedListings({ baseUrl: BASE_URL })).toBeUndefined();

    resolvers[1]?.();
    await current;
    expect(peekCachedListings({ baseUrl: BASE_URL })).toBeDefined();
  });

  it("does not keep a listings body that fails validation", async () => {
    mockFetchOk([{}]);
    const client = createApiClient({ baseUrl: BASE_URL, retry: false });
    await expect(client.getListings()).rejects.toThrow();
    expect(peekCachedListings({ baseUrl: BASE_URL })).toBeUndefined();

    mockFetchOk([makeListing()]);
    await expect(client.getListings()).resolves.toHaveLength(1);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it("applies the first caller's retry settings to a shared request", async () => {
    const fetchMock = mockFetchSequence([{ status: 503 }, { status: 200, body: [makeListing()] }]);
    const noRetry = createApiClient({ baseUrl: BASE_URL, retry: false });
    const withRetry = createApiClient({
      baseUrl: BASE_URL,
      retry: { maxAttempts: 3, baseDelayMs: 0 }
    });

    const results = await Promise.allSettled([noRetry.getListings(), withRetry.getListings()]);

    expect(results.map(r => r.status)).toEqual(["rejected", "rejected"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const retried = mockFetchSequence([{ status: 503 }, { status: 200, body: [makeListing()] }]);
    const first = createApiClient({ baseUrl: BASE_URL, retry: { maxAttempts: 3, baseDelayMs: 0 } });
    const second = createApiClient({ baseUrl: BASE_URL, retry: false });

    const joined = await Promise.all([first.getListings(), second.getListings()]);

    expect(joined.map(listings => listings.length)).toEqual([1, 1]);
    expect(retried).toHaveBeenCalledTimes(2);
  });
});

describe("peekCachedListings", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns undefined before any listings are known", () => {
    vi.stubGlobal("sessionStorage", createMockStorage());
    expect(peekCachedListings({ baseUrl: BASE_URL, staleCache: true })).toBeUndefined();
  });

  it("returns normalized listings once a shared response has settled", async () => {
    mockFetchOk([makeListing({ uiid: "bb", results: [] })]);
    await createApiClient({ baseUrl: BASE_URL, retry: false }).getListings();

    const peeked = peekCachedListings({ baseUrl: `${BASE_URL}/` });
    expect(peeked?.map(listing => listing.uiid)).toEqual(["bb"]);
  });

  it("falls back to the stale cache only when staleCache is enabled", () => {
    const storage = createMockStorage();
    storage.setItem(
      `indy-charts:stale:${BASE_URL}/indicators`,
      JSON.stringify([makeListing({ uiid: "RSI", chartType: "oscillator" })])
    );
    vi.stubGlobal("sessionStorage", storage);

    expect(peekCachedListings({ baseUrl: BASE_URL })).toBeUndefined();
    expect(peekCachedListings({ baseUrl: BASE_URL, staleCache: true })?.[0]?.chartType).toBe(
      "oscillator"
    );
  });

  it("falls through to the stale copy when a settled body fails normalization", async () => {
    const storage = createMockStorage();
    storage.setItem(
      `indy-charts:stale:${BASE_URL}/indicators`,
      JSON.stringify([makeListing({ uiid: "RSI", chartType: "oscillator" })])
    );
    vi.stubGlobal("sessionStorage", storage);
    // Quote rows served from the listings URL settle fine for getQuotes but are not listings.
    mockFetchOk([createQuote("2024-01-01T00:00:00Z")]);
    await createApiClient({
      baseUrl: BASE_URL,
      retry: false,
      endpoints: { quotes: "indicators" }
    }).getQuotes();

    expect(peekCachedListings({ baseUrl: BASE_URL, staleCache: true })?.[0]?.uiid).toBe("RSI");
  });
});
