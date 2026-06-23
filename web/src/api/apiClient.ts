import type {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  Quote
} from "@facioquo/indy-charts";

import { env } from "../config/env";
import backupIndicators from "../data/backup-indicators.json";
import backupQuotes from "../data/backup-quotes.json";

interface ApiQuote {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Error carrying an HTTP-ish status; `0` denotes a network/transport failure. */
class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetch-based port of the Angular `ApiService`. Talks to the .NET Web API and
 * falls back to bundled backup data when the backend is unavailable, preserving
 * the original backup-mode semantics:
 *
 * `backupActive` is armed only when **quotes or listings** fall back (the
 * candlesticks would be at 2016-2019 timestamps), so `getSelectionData`
 * short-circuits to timestamp-aligned empty rows. A transient indicator-only
 * failure returns `[]` without arming the flag.
 */
export class ApiClient {
  private backupActive = false;
  private cachedBackupRows: Array<{ timestamp: string; candle: unknown }> | undefined;

  /** Whether the API has fallen back to bundled backup data. */
  get isBackupActive(): boolean {
    return this.backupActive;
  }

  async getQuotes(): Promise<Quote[]> {
    try {
      const res = await this.getJson<ApiQuote[]>(`${env.api}/quotes`);
      const quotes = this.toQuotes(res);
      this.backupActive = false;
      return quotes;
    } catch (error) {
      this.backupActive = true;
      console.warn(
        "Backend API unavailable, using client-side backup quotes",
        this.errorInfo(error)
      );
      return this.toQuotes(backupQuotes as ApiQuote[]);
    }
  }

  async getListings(): Promise<IndicatorListing[]> {
    try {
      const listings = await this.getJson<IndicatorListing[]>(`${env.api}/indicators`);
      this.backupActive = false;
      return listings;
    } catch (error) {
      this.backupActive = true;
      console.warn(
        "Backend API unavailable, using client-side backup indicators",
        this.errorInfo(error)
      );
      return backupIndicators as IndicatorListing[];
    }
  }

  async getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): Promise<unknown[]> {
    // When quotes/listings already fell back to backup data, live indicator
    // results (current dates) would diverge from backup candlesticks (2016-2019).
    // Return rows aligned to backup quote timestamps so every x-axis stays pinned.
    if (this.backupActive) {
      console.warn("Backup data active, returning timestamp-aligned empty data for indicator", {
        uiid: selection.uiid
      });
      return this.backupSelectionRows();
    }

    const params = new URLSearchParams();
    selection.params.forEach((p: IndicatorParam) => {
      params.set(p.paramName, String(p.value));
    });
    const url = this.buildApiUrl(listing.endpoint, params);

    try {
      return await this.getJson<unknown[]>(url);
    } catch (error) {
      if (!this.isTransientBackendUnavailable(error)) {
        throw error;
      }
      // Do NOT arm backupActive here — quotes/listings are still live, so the
      // candlesticks are at live timestamps. Empty array renders as gaps and
      // lets the overlay's other live datasets keep the x-axis anchored.
      console.warn("Backend API unavailable, using empty data for indicator", {
        uiid: selection.uiid,
        status: error instanceof ApiError ? error.status : 0
      });
      return [];
    }
  }

  // HELPERS

  private async getJson<T>(url: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, { headers: { Accept: "application/json" } });
    } catch (cause) {
      // Network/transport failure — model as status 0 (matches Angular status 0).
      throw new ApiError(cause instanceof Error ? cause.message : "Network error", 0, url);
    }
    if (!response.ok) {
      throw new ApiError(`Request failed: ${response.status}`, response.status, url);
    }
    return (await response.json()) as T;
  }

  /** One backup row per quote, carrying timestamp + candle (NaN y-values -> gaps). */
  private backupSelectionRows(): Array<{ timestamp: string; candle: unknown }> {
    if (!this.cachedBackupRows) {
      const quotes = backupQuotes as ApiQuote[];
      this.cachedBackupRows = quotes.map(q => ({ timestamp: q.timestamp, candle: q }));
    }
    return [...this.cachedBackupRows];
  }

  private buildApiUrl(endpoint: string, params: URLSearchParams): string {
    const baseUrl = env.api.endsWith("/") ? env.api : `${env.api}/`;
    const url = new URL(endpoint, baseUrl);
    params.forEach((value, key) => url.searchParams.set(key, value));
    return url.toString();
  }

  private isTransientBackendUnavailable(error: unknown): boolean {
    if (!(error instanceof ApiError)) return false;
    return (
      error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504
    );
  }

  private toQuotes(raw: ApiQuote[]): Quote[] {
    return raw.map((q, index) => ({
      timestamp: this.parseTimestamp(q.timestamp, index),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    }));
  }

  private parseTimestamp(value: string, index: number): Date {
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(`Invalid quote timestamp at index ${index}: "${value}"`);
    }
    return timestamp;
  }

  private errorInfo(error: unknown): Record<string, unknown> {
    if (error instanceof ApiError) {
      return { status: error.status, url: error.url, message: error.message };
    }
    return { message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared singleton, mirroring Angular's `providedIn: "root"`. */
export const apiClient = new ApiClient();
