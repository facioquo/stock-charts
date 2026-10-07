import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { IndicatorListing, IndicatorSelection } from "@facioquo/indy-charts";

import { ApiClient, BATCH_REFUSED, BATCH_SIZE } from "./apiClient";
import backupQuotes from "../data/backup-quotes.json";

const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Response;

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: () => Promise.resolve([]) }) as unknown as Response;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiClient", () => {
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

  it("falls back to bundled backup quotes and arms backup mode on network failure", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const quotes = await api.getQuotes();

    expect(quotes.length).toBe((backupQuotes as unknown[]).length);
    expect(quotes.length).toBeGreaterThan(0);
    expect(api.isBackupActive).toBe(true);
  });

  it("returns timestamp-aligned backup rows for indicator data while backup mode is active", async () => {
    const api = new ApiClient();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await api.getQuotes(); // arms backup mode

    const selection = { uiid: "RSI", params: [] } as unknown as IndicatorSelection;
    const listing = { endpoint: "RSI/", chartType: "oscillator" } as unknown as IndicatorListing;

    const rows = await api.getSelectionData(selection, listing);

    expect(rows.length).toBe((backupQuotes as unknown[]).length);
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

    it("uses backup rows, with no request, while backup mode is active", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
      const api = new ApiClient();
      await api.getQuotes(); // arms backup mode
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      const rows = await Promise.all(api.getSelectionsData(requests));

      expect(rows[0]?.length).toBe((backupQuotes as unknown[]).length);
      expect(fetchMock).not.toHaveBeenCalled();
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
