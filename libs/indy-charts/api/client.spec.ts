import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createApiClient } from "./client";
import type { ApiClient } from "./client";
import type {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  RawQuote
} from "../config/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.example.com";

function rawQuote(dateStr: string, close = 100): RawQuote {
  return {
    date: dateStr,
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
      statusText: "OK"
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
      statusText
    })
  );
}

function mockFetchNetworkError(message: string): void {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error(message)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createApiClient", () => {
  let client: ApiClient;
  let onError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onError = vi.fn();
    client = createApiClient({ baseUrl: BASE_URL, onError });
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
    it("returns Quote[] with Date objects from raw ISO strings", async () => {
      const raw: RawQuote[] = [rawQuote("2024-01-01T00:00:00Z"), rawQuote("2024-01-02T00:00:00Z")];
      mockFetchOk(raw);

      const quotes = await client.getQuotes();

      expect(quotes).toHaveLength(2);
      expect(quotes[0].date).toBeInstanceOf(Date);
      expect(quotes[0].date.toISOString()).toBe("2024-01-01T00:00:00.000Z");
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
      mockFetchOk([rawQuote("not-a-date")]);

      await expect(client.getQuotes()).rejects.toThrow(
        'Invalid quote date at index 0: "not-a-date"'
      );
      expect(onError).toHaveBeenCalledWith("Error fetching quotes", expect.any(Error));
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
      const raw: RawQuote[] = [
        { date: "2024-06-15T00:00:00Z", open: 10, high: 20, low: 5, close: 15, volume: 9999 }
      ];
      mockFetchOk(raw);

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
        { date: "2024-01-01", sma: 50.5 },
        { date: "2024-01-02", sma: 51.0 }
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

  describe("onError callback", () => {
    it("works without onError callback (no error thrown)", async () => {
      mockFetchError(500, "Server Error");
      const c = createApiClient({ baseUrl: BASE_URL });

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
