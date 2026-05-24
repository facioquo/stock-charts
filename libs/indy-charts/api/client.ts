import {
  type IndicatorListing,
  type IndicatorParam,
  type IndicatorSelection,
  type Quote
} from "../config/types";
import { type RawIndicatorRow } from "./static";

/**
 * Configuration for {@link createApiClient}.
 *
 * @example
 * ```ts
 * const config: ApiClientConfig = {
 *   baseUrl: "https://api.example.com/",
 *   onError: (ctx, err) => console.error(ctx, err),
 * };
 * ```
 */
export interface ApiClientConfig {
  /**
   * Root URL of the API server. A trailing slash is recommended but optional —
   * `createApiClient` normalises it internally.
   *
   * @example "https://api.example.com/"
   */
  baseUrl: string;

  /** Optional endpoint overrides for hosts that mount API routes elsewhere. */
  endpoints?: {
    quotes?: string;
    indicators?: string;
  };

  /**
   * Optional error callback invoked whenever a fetch operation throws or
   * receives a non-2xx response.  The error is **re-thrown** after the
   * callback returns, so callers still need to handle it.
   *
   * @param context - Human-readable description of the failed operation.
   * @param error   - The original caught value (usually an `Error` instance).
   */
  onError?: (context: string, error: unknown) => void;
}

/**
 * Lightweight HTTP client for the stock-charts API.
 *
 * Obtain an instance with {@link createApiClient}.
 */
export interface ApiClient {
  /**
   * Fetches the raw OHLCV quote history from `GET /quotes`.
   *
   * @returns Resolved array of {@link Quote} objects sorted chronologically.
   * @throws  Re-throws any network or HTTP error (after calling `onError`).
   */
  getQuotes(): Promise<Quote[]>;

  /**
   * Fetches all available indicator listings from `GET /indicators`.
   *
   * @returns Resolved array of {@link IndicatorListing} descriptors.
   * @throws  Re-throws any network or HTTP error (after calling `onError`).
   */
  getListings(): Promise<IndicatorListing[]>;

  /**
   * Fetches computed indicator data for the given selection and listing.
   * Query-string parameters are derived from {@link IndicatorSelection.params}.
   *
   * @param selection - The user's current indicator parameter choices.
   * @param listing   - The indicator descriptor that provides the endpoint path.
   * @returns Resolved array of raw data rows for the indicator series.
   * @throws  Re-throws any network or HTTP error (after calling `onError`).
   */
  getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): Promise<RawIndicatorRow[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeQuotes(quotes: unknown[]): Quote[] {
  function asFiniteNumber(value: unknown, field: string, index: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(
        `Invalid quote at index ${index}: "${field}" must be a finite number, got ${typeof value}`
      );
    }
    return value;
  }

  return quotes.map((q, index) => {
    if (!isRecord(q)) {
      throw new Error(`Invalid quote at index ${index}: expected object, got ${typeof q}`);
    }

    const rawDate = q["timestamp"];
    if (rawDate === undefined || rawDate === null) {
      throw new Error(`Invalid quote at index ${index}: missing 'timestamp' field`);
    }

    return {
      open: asFiniteNumber(q["open"], "open", index),
      high: asFiniteNumber(q["high"], "high", index),
      low: asFiniteNumber(q["low"], "low", index),
      close: asFiniteNumber(q["close"], "close", index),
      volume: asFiniteNumber(q["volume"], "volume", index),
      timestamp:
        rawDate instanceof Date
          ? normalizeQuoteDate(rawDate, index)
          : typeof rawDate === "string"
            ? parseQuoteDate(rawDate.trim(), index)
            : (() => {
                throw new Error(
                  `Invalid quote at index ${index}: 'timestamp' must be string or Date, got ${typeof rawDate}`
                );
              })()
    };
  });
}

function normalizeQuoteDate(value: Date, index: number): Date {
  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid quote date at index ${index}: "${value.toString()}"`);
  }
  return value;
}

function parseQuoteDate(value: string, index: number): Date {
  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid quote date at index ${index}: "${value}"`);
  }
  return date;
}

function endpointUrl(baseUrl: string, endpoint: string): string {
  return new URL(endpoint, baseUrl).toString();
}

/**
 * Factory that creates a ready-to-use {@link ApiClient}.
 *
 * The `baseUrl` is normalised to always end with `/` so that relative
 * endpoint paths resolve correctly via `new URL(path, base)`.
 *
 * @param config - Connection and error-handling options.
 * @returns A fully configured {@link ApiClient} instance.
 *
 * @example
 * ```ts
 * const client = createApiClient({
 *   baseUrl: "https://api.example.com",
 *   onError: (ctx, err) => console.error(ctx, err),
 * });
 * const quotes = await client.getQuotes();
 * ```
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  const { endpoints, onError } = config;
  // Ensure baseUrl always ends with "/" so new URL(path, base) resolves correctly.
  const baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;

  return {
    async getQuotes(): Promise<Quote[]> {
      try {
        const response = await fetch(endpointUrl(baseUrl, endpoints?.quotes ?? "quotes"));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const body = (await response.json()) as unknown;
        if (!Array.isArray(body)) {
          throw new Error("Invalid quotes response: expected an array");
        }
        return normalizeQuotes(body);
      } catch (error) {
        onError?.("Error fetching quotes", error);
        throw error;
      }
    },

    async getListings(): Promise<IndicatorListing[]> {
      try {
        const response = await fetch(endpointUrl(baseUrl, endpoints?.indicators ?? "indicators"));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as IndicatorListing[];
        return data;
      } catch (error) {
        onError?.("Error fetching listings", error);
        throw error;
      }
    },

    async getSelectionData(
      selection: IndicatorSelection,
      listing: IndicatorListing
    ): Promise<RawIndicatorRow[]> {
      const endpointUrl = new URL(listing.endpoint, baseUrl);
      selection.params.forEach((p: IndicatorParam) => {
        if (p.value != null) {
          endpointUrl.searchParams.set(p.paramName, String(p.value));
        }
      });

      const url = endpointUrl.toString();

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as RawIndicatorRow[];
        return data;
      } catch (error) {
        onError?.("Error fetching selection data", error);
        throw error;
      }
    }
  };
}
