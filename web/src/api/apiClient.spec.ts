import { afterEach, describe, expect, it, vi } from "vitest";

import type { IndicatorListing, IndicatorSelection } from "@facioquo/indy-charts";

import { ApiClient } from "./apiClient";
import backupQuotes from "../data/backup-quotes.json";

const okResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: async () => [] }) as unknown as Response;

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
});
