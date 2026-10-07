import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { clearApiClientCache, createDefaultSelection } from "@facioquo/indy-charts";
import type { IndicatorListing, IndicatorSelection } from "@facioquo/indy-charts";

import { DEFAULT_INDICATORS } from "../charting/defaultIndicators";
import { ApiClient, BATCH_REFUSED, BATCH_SIZE } from "./apiClient";

const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Response;

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: () => Promise.resolve([]) }) as unknown as Response;

afterEach(() => {
  vi.restoreAllMocks();
});

const SNAPSHOT_FILES = import.meta.glob<unknown>("../../public/data/chart-api/**/*.json", {
  eager: true,
  import: "default"
});

type FetchFn = (...args: [string | URL]) => Promise<Response>;

/** Serves the committed snapshot for `/data/chart-api/*` and fails every other request. */
const snapshotOnlyFetch = (): Mock<FetchFn> =>
  vi.fn<FetchFn>((input: string | URL) => {
    const url = new URL(String(input), "http://localhost");
    if (!url.pathname.startsWith("/data/chart-api/") || url.origin !== "http://localhost") {
      return Promise.reject(new TypeError("Failed to fetch"));
    }
    const body = SNAPSHOT_FILES[`../../public${decodeURIComponent(url.pathname)}`];
    return Promise.resolve(body === undefined ? errorResponse(404) : okResponse(body));
  });

describe("ApiClient", () => {
  beforeEach(() => {
    clearApiClientCache();
  });

  it("normalizes quote timestamps to Date and clears backup mode on success", async () => {
    const api = new ApiClient();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        okResponse([
          {
            timestamp: "2024-01-02T00:00:00Z",
            open: 1,
            high: 2,
            low: 0.5,
            close: 1.5,
            volume: 100
          }
        ])
      )
    );

    const quotes = await api.getQuotes();

    expect(quotes).toHaveLength(1);
    expect(quotes[0].timestamp).toBeInstanceOf(Date);
    expect(api.isBackupActive).toBe(false);
  });

  it("serves the snapshot and arms backup mode when the API is unreachable", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", snapshotOnlyFetch());

    const quotes = await api.getQuotes();
    const listings = await api.getListings();

    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].timestamp).toBeInstanceOf(Date);
    expect(listings.length).toBeGreaterThan(0);
    expect(api.isBackupActive).toBe(true);
  });

  it("stays in backup mode when quotes come from the snapshot and listings from the API", async () => {
    const api = new ApiClient();
    const snapshot = snapshotOnlyFetch();
    vi.stubGlobal(
      "fetch",
      vi.fn((input: string | URL) => {
        const url = String(input);
        if (url.includes("/data/chart-api/")) return snapshot(input);
        if (url.endsWith("/indicators")) return Promise.resolve(okResponse([]));
        return Promise.reject(new TypeError("Failed to fetch"));
      })
    );

    api.resetBackup();
    await api.getQuotes();
    await api.getListings();

    expect(api.isBackupActive).toBe(true);
  });

  it("clears backup mode when a load starts", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", snapshotOnlyFetch());
    await api.getQuotes();
    expect(api.isBackupActive).toBe(true);

    api.resetBackup();

    expect(api.isBackupActive).toBe(false);
  });

  it("reads snapshot rows, not live rows, once backup mode is active", async () => {
    const api = new ApiClient();
    const snapshot = snapshotOnlyFetch();
    vi.stubGlobal("fetch", snapshot);
    await api.getQuotes();
    const listings = await api.getListings();
    const listing = listings.find(item => item.uiid === "RSI") as IndicatorListing;
    // The API recovers while the saved indicators are restoring.
    const recovered = vi.fn((input: string | URL) =>
      String(input).includes("/data/chart-api/")
        ? snapshot(input)
        : Promise.resolve(okResponse([{ live: true }]))
    );
    vi.stubGlobal("fetch", recovered);

    const rows = await api.getSelectionData(createDefaultSelection(listing), listing);

    expect(rows.length).toBeGreaterThan(0);
    expect(rows).not.toEqual([{ live: true }]);
    expect(recovered.mock.calls.every(call => String(call[0]).includes("/data/chart-api/"))).toBe(
      true
    );
  });

  it("holds a snapshot file for every indicator the demo opens with", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", snapshotOnlyFetch());
    await api.getQuotes();
    const listings = await api.getListings();

    const empty: string[] = [];
    for (const { uiid, lookbackPeriods } of DEFAULT_INDICATORS) {
      const listing = listings.find(item => item.uiid === uiid) as IndicatorListing;
      const selection = createDefaultSelection(
        listing,
        lookbackPeriods === undefined ? undefined : { lookbackPeriods }
      );
      if ((await api.getSelectionData(selection, listing)).length === 0) empty.push(uiid);
    }

    expect(empty).toEqual([]);
  });

  it("throws when the API and the snapshot are both unavailable", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(api.getQuotes()).rejects.toThrow();
    expect(api.isBackupActive).toBe(false);
  });

  it("serves snapshot rows for every catalog indicator while backup mode is active", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", snapshotOnlyFetch());
    await api.getQuotes();
    const listings = await api.getListings();

    const results = await Promise.all(
      listings.map(async listing => ({
        uiid: listing.uiid,
        rows: await api.getSelectionData(createDefaultSelection(listing), listing)
      }))
    );
    const empty = results.filter(({ rows }) => rows.length === 0).map(({ uiid }) => uiid);

    expect(empty).toEqual([]);
  });

  it("returns no rows for a selection the snapshot does not hold", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", snapshotOnlyFetch());
    await api.getQuotes();
    const listings = await api.getListings();
    const listing = listings.find(item => item.uiid === "RSI") as IndicatorListing;
    const selection = createDefaultSelection(listing);
    selection.params.forEach(p => {
      p.value = 9999;
    });

    expect(await api.getSelectionData(selection, listing)).toEqual([]);
  });

  it("returns empty data (without arming backup mode) on a transient indicator-only 503", async () => {
    const api = new ApiClient();
    // quotes + listings succeed, so backup mode is NOT armed
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(okResponse([])) // not used here, kept for clarity
        .mockResolvedValue(errorResponse(503))
    );

    const selection = {
      uiid: "RSI",
      params: [{ paramName: "lookbackPeriods", value: 5 }]
    } as unknown as IndicatorSelection;
    const listing = { endpoint: "RSI/", chartType: "oscillator" } as unknown as IndicatorListing;

    const rows = await api.getSelectionData(selection, listing);

    expect(rows).toEqual([]);
    expect(api.isBackupActive).toBe(false);
  });

  describe("getSelectionsData", () => {
    const request = (
      uiid: string,
      value: number
    ): { selection: IndicatorSelection; listing: IndicatorListing } => ({
      selection: {
        uiid,
        params: [{ paramName: "lookbackPeriods", value }]
      } as unknown as IndicatorSelection,
      listing: { endpoint: `${uiid}/`, chartType: "oscillator" } as unknown as IndicatorListing
    });
    const requests = [request("ADX", 14), request("RSI", 5), request("MACD", 12)];
    const urlOf = (call: unknown[]): string => String(call[0]);

    it("fetches every selection with one batch request, in request order", async () => {
      const fetchMock = vi.fn().mockResolvedValue(
        okResponse([
          { status: 200, data: [{ a: 1 }] },
          { status: 200, data: [{ b: 2 }] },
          { status: 200, data: [{ c: 3 }] }
        ])
      );
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = new URL(urlOf(fetchMock.mock.calls[0] ?? []));
      expect(url.pathname).toBe("/indicators/batch");
      expect(url.searchParams.getAll("s")).toEqual([
        "ADX?lookbackPeriods=14",
        "RSI?lookbackPeriods=5",
        "MACD?lookbackPeriods=12"
      ]);
    });

    it("matches items to selections by the selection each echoes, whatever order they arrive in", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          okResponse([
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] },
            { selection: "MACD?lookbackPeriods=12", status: 200, data: [{ c: 3 }] },
            { selection: "RSI?lookbackPeriods=5", status: 200, data: [{ b: 2 }] }
          ])
        )
      );

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]]);
    });

    it("answers the same selection requested twice from its echoed items", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          okResponse([
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] },
            { selection: "RSI?lookbackPeriods=5", status: 200, data: [{ b: 2 }] },
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] }
          ])
        )
      );
      const twice = [request("ADX", 14), request("RSI", 5), request("ADX", 14)];

      const rows = await Promise.all(new ApiClient().getSelectionsData(twice));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ a: 1 }]]);
    });

    it("answers only the echoed items of a partly echoing batch, and requests the rest alone", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          okResponse([
            { status: 200, data: [{ x: 9 }] },
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] },
            { status: 200, data: [{ y: 8 }] }
          ])
        )
        .mockResolvedValue(okResponse([{ ok: 1 }]));
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ ok: 1 }], [{ ok: 1 }]]);
    });

    it("requests the right selection alone when a reordered batch fails one item", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          okResponse([
            { selection: "RSI?lookbackPeriods=5", status: 400, error: "bad" },
            { selection: "MACD?lookbackPeriods=12", status: 200, data: [{ c: 3 }] },
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] }
          ])
        )
        .mockResolvedValue(okResponse([{ alone: 1 }]));
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ alone: 1 }], [{ c: 3 }]]);
      expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/RSI/");
    });

    it("matches an echoed selection ignoring case", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          okResponse([
            { selection: "rsi?lookbackperiods=5", status: 200, data: [{ b: 2 }] },
            { selection: "adx?lookbackperiods=14", status: 200, data: [{ a: 1 }] },
            { selection: "macd?lookbackperiods=12", status: 200, data: [{ c: 3 }] }
          ])
        )
      );

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]]);
    });

    it("asks for a selection alone when an echoed batch has no item for it", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          okResponse([
            { selection: "ADX?lookbackPeriods=14", status: 200, data: [{ a: 1 }] },
            { selection: "RSI?lookbackPeriods=5", status: 200, data: [{ b: 2 }] },
            { selection: "ADL", status: 200, data: [{ z: 9 }] }
          ])
        )
        .mockResolvedValue(okResponse([{ ok: 1 }]));
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ ok: 1 }]]);
    });

    it("asks for a selection alone when the batch leaves it out", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          okResponse([
            { status: 200, data: [{ a: 1 }] },
            { status: 400, error: "bad" },
            { status: 200, data: [{ c: 3 }] }
          ])
        )
        .mockResolvedValue(okResponse([{ b: 2 }]));
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ a: 1 }], [{ b: 2 }], [{ c: 3 }]]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(urlOf(fetchMock.mock.calls[1] ?? [])).toContain("/RSI/?lookbackPeriods=5");
    });

    it("falls back to one request per selection on an older backend, and stops asking for the batch", async () => {
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve(
          url.includes("/indicators/batch") ? errorResponse(404) : okResponse([{ ok: 1 }])
        )
      );
      vi.stubGlobal("fetch", fetchMock);
      const api = new ApiClient();

      const first = await Promise.all(api.getSelectionsData(requests));
      expect(first).toEqual([[{ ok: 1 }], [{ ok: 1 }], [{ ok: 1 }]]);
      expect(
        fetchMock.mock.calls.filter(([url]) => url.includes("/indicators/batch"))
      ).toHaveLength(1);

      fetchMock.mockClear();
      await Promise.all(api.getSelectionsData(requests));
      expect(fetchMock.mock.calls.some(([url]) => url.includes("/indicators/batch"))).toBe(false);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it("splits a long list into batch requests no larger than the API cap, keeping every row with its selection", async () => {
      const many = Array.from({ length: 25 }, (_, i) => request("ADX", i + 1));
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve(
          okResponse(
            new URL(url).searchParams.getAll("s").map(name => ({ status: 200, data: [{ name }] }))
          )
        )
      );
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(many));

      expect(rows.map(row => (row as Array<{ name: string }>)[0]?.name)).toEqual(
        many.map((_, i) => `ADX?lookbackPeriods=${i + 1}`)
      );
      expect(
        fetchMock.mock.calls.map(([url]) => new URL(url).searchParams.getAll("s").length)
      ).toEqual([BATCH_SIZE, 5]);
    });

    it.each([...BATCH_REFUSED])("stops asking for the batch after a %i", async status => {
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve(
          url.includes("/indicators/batch") ? errorResponse(status) : okResponse([{ ok: 1 }])
        )
      );
      vi.stubGlobal("fetch", fetchMock);
      const api = new ApiClient();

      await Promise.all(api.getSelectionsData(requests));
      fetchMock.mockClear();
      await Promise.all(api.getSelectionsData(requests));

      expect(fetchMock.mock.calls.some(([url]) => url.includes("/indicators/batch"))).toBe(false);
    });

    it.each([429, 503])("keeps asking for the batch after a transient %i", async status => {
      const fetchMock = vi.fn((url: string) =>
        Promise.resolve(
          url.includes("/indicators/batch") ? errorResponse(status) : okResponse([{ ok: 1 }])
        )
      );
      vi.stubGlobal("fetch", fetchMock);
      const api = new ApiClient();

      await Promise.all(api.getSelectionsData(requests));
      fetchMock.mockClear();
      await Promise.all(api.getSelectionsData(requests));

      expect(fetchMock.mock.calls.some(([url]) => url.includes("/indicators/batch"))).toBe(true);
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

    it("falls back per selection, but keeps trying the batch, after a network failure", async () => {
      const fetchMock = vi.fn((url: string) =>
        url.includes("/indicators/batch")
          ? Promise.reject(new TypeError("offline"))
          : Promise.resolve(okResponse([{ ok: 1 }]))
      );
      vi.stubGlobal("fetch", fetchMock);
      const api = new ApiClient();

      await Promise.all(api.getSelectionsData(requests));
      await Promise.all(api.getSelectionsData(requests));

      expect(
        fetchMock.mock.calls.filter(([url]) => url.includes("/indicators/batch"))
      ).toHaveLength(2);
    });

    it("does not batch a single selection", async () => {
      const fetchMock = vi.fn().mockResolvedValue(okResponse([{ ok: 1 }]));
      vi.stubGlobal("fetch", fetchMock);

      await Promise.all(new ApiClient().getSelectionsData(requests.slice(0, 1)));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(urlOf(fetchMock.mock.calls[0] ?? [])).not.toContain("/indicators/batch");
    });

    it("reads snapshot rows, never the batch route, while backup mode is active", async () => {
      const fetchMock = snapshotOnlyFetch();
      vi.stubGlobal("fetch", fetchMock);
      const api = new ApiClient();
      await api.getQuotes(); // arms backup mode

      const rows = await Promise.all(
        api.getSelectionsData([request("RSI", 5), request("ADX", 14)])
      );

      expect(rows.every(row => row.length > 0)).toBe(true);
      const urls = fetchMock.mock.calls.map(call => String(call[0]));
      expect(urls.some(url => url.includes("/indicators/batch"))).toBe(false);
    });

    it("ignores a batch answer of the wrong length", async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(okResponse([{ status: 200, data: [{ a: 1 }] }]))
        .mockResolvedValue(okResponse([{ ok: 1 }]));
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(new ApiClient().getSelectionsData(requests));

      expect(rows).toEqual([[{ ok: 1 }], [{ ok: 1 }], [{ ok: 1 }]]);
    });
  });
});
