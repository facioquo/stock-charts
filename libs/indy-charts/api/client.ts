import {
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorParam,
  type IndicatorResultConfig,
  type IndicatorSelection,
  type Bar
} from "../config/types";

// ---------------------------------------------------------------------------
// Retry helpers
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 500;
const STALE_CACHE_PREFIX = "indy-charts:stale:";

function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Computes exponential back-off delay with ±25% jitter.
 * @param retryIndex - Zero-based retry index (0 on first retry).
 * @param baseDelayMs - Starting delay in milliseconds.
 * @returns Delay in milliseconds: `baseDelayMs * 2^retryIndex + rand(0, 0.25 * baseDelayMs)`.
 */
function backoffMs(retryIndex: number, baseDelayMs: number): number {
  const exponential = baseDelayMs * Math.pow(2, retryIndex);
  const jitter = Math.floor(Math.random() * baseDelayMs * 0.25);
  return exponential + jitter;
}

/**
 * Wraps `fetch` with exponential back-off retry for transient failures.
 *
 * - Retries on network errors (fetch rejection), `5xx`, and `429`.
 * - Returns immediately on `2xx` and non-transient `4xx`.
 * - After `maxAttempts` attempts the last error/response is surfaced.
 */
async function fetchWithRetry(
  url: string,
  maxAttempts: number,
  baseDelayMs: number
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const isLast = attempt >= maxAttempts - 1;
    try {
      const response = await fetch(url);
      if (response.ok || !isTransientStatus(response.status) || isLast) {
        return response;
      }
      // transient HTTP error on a non-final attempt — retry
    } catch (networkError) {
      if (isLast) throw networkError;
      // network error on a non-final attempt — retry
    }
    await sleep(backoffMs(attempt, baseDelayMs));
  }
}

// ---------------------------------------------------------------------------
// Stale-cache helpers (sessionStorage, browser-only)
// ---------------------------------------------------------------------------

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    return null;
  }
}

function tryStaleCacheRead<T>(url: string): T | null {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STALE_CACHE_PREFIX + url);
    return raw !== null ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function tryStaleCacheWrite(url: string, data: unknown): void {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(STALE_CACHE_PREFIX + url, JSON.stringify(data));
  } catch {
    // Ignore quota-exceeded or other errors (e.g. private-browsing restrictions)
  }
}

// ---------------------------------------------------------------------------

const STYLE_COLORS = {
  ORANGE: "#EF6C00",
  RED: "#DD2C00",
  GREEN: "#2E7D32",
  BLUE: "#1E88E5",
  DARK_GRAY: "#616161CC",
  DARK_GRAY_TRANSPARENT: "#61616110"
} as const;

/**
 * Retry policy for transient API failures used by {@link ApiClientConfig}.
 */
export interface RetryConfig {
  /**
   * Maximum number of fetch attempts (initial attempt + retries).
   * `1` disables retries. Defaults to `3`.
   */
  maxAttempts?: number;
  /**
   * Base delay in milliseconds for exponential back-off.
   * Actual delay for retry `n` ≈ `baseDelayMs × 2^(n−1)` plus a small random jitter.
   * Defaults to `500`.
   */
  baseDelayMs?: number;
}

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

  /**
   * Retry policy for transient failures — network errors, `5xx`, and `429`.
   *
   * Set to `false` to disable all retries.
   * Defaults to `{ maxAttempts: 3, baseDelayMs: 500 }`.
   */
  retry?: RetryConfig | false;

  /**
   * When `true`, each successful response is stored in `sessionStorage` (browser
   * only).  If all retries fail, the last stored value is returned and
   * {@link onStale} is called so the consumer can surface a "stale data" indicator.
   *
   * Defaults to `false`.
   */
  staleCache?: boolean;

  /**
   * Called when stale cached data is returned because the live request and all
   * retries failed.
   *
   * @param context - Human-readable description of the operation that is stale
   *                  (e.g. `"quotes"`, `"listings"`, `"selection data"`).
   */
  onStale?: (context: string) => void;
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
   * @returns Resolved array of {@link Bar} objects sorted chronologically.
   * @throws  Re-throws any network or HTTP error (after calling `onError`).
   */
  getQuotes(): Promise<Bar[]>;

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
  ): Promise<IndicatorDataRow[]>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeQuotes(quotes: unknown[]): Bar[] {
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

function normalizeListings(listings: IndicatorListing[]): IndicatorListing[] {
  return listings.map(listing => {
    const uiid = listing.uiid.toUpperCase();
    const normalizedResults = listing.results.map(result => normalizeResult(uiid, result));
    return {
      ...listing,
      results: normalizedResults
    };
  });
}

function normalizeResult(uiid: string, result: IndicatorResultConfig): IndicatorResultConfig {
  const dataName = result.dataName.toLowerCase();

  if (uiid === "PIVOT-POINTS") {
    return {
      ...result,
      lineType: dataName === "pp" ? "solid" : "dash",
      lineWidth: 1,
      segmented: true,
      segmentMode: "step",
      defaultColor:
        dataName === "pp"
          ? STYLE_COLORS.DARK_GRAY
          : dataName.startsWith("r")
            ? STYLE_COLORS.RED
            : STYLE_COLORS.GREEN
    };
  }

  if (uiid === "STDEV-CH") {
    return {
      ...result,
      lineType: dataName === "centerline" ? "dash" : "solid",
      lineWidth: 1,
      segmented: true,
      segmentMode: "slope",
      defaultColor: STYLE_COLORS.ORANGE,
      fill:
        dataName === "upperchannel"
          ? {
              target: "+2",
              colorAbove: STYLE_COLORS.DARK_GRAY_TRANSPARENT,
              colorBelow: STYLE_COLORS.DARK_GRAY_TRANSPARENT
            }
          : result.fill
    };
  }

  if (uiid === "BB") {
    return {
      ...result,
      lineType: dataName === "sma" ? "dash" : "solid",
      lineWidth: 1,
      defaultColor: STYLE_COLORS.ORANGE
    };
  }

  if (uiid === "ROLLING-PIVOTS") {
    return {
      ...result,
      lineType: dataName === "pp" ? "solid" : "dash",
      lineWidth: 1,
      segmented: false,
      defaultColor:
        dataName === "pp"
          ? STYLE_COLORS.BLUE
          : dataName.startsWith("r")
            ? STYLE_COLORS.RED
            : STYLE_COLORS.GREEN
    };
  }

  return result;
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
  const { endpoints, onError, staleCache, onStale } = config;
  // Ensure baseUrl always ends with "/" so new URL(path, base) resolves correctly.
  const baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;

  const retryEnabled = config.retry !== false;
  const maxAttempts = retryEnabled
    ? ((config.retry as RetryConfig | undefined)?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)
    : 1;
  const baseDelayMs = retryEnabled
    ? ((config.retry as RetryConfig | undefined)?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS)
    : 0;

  return {
    async getQuotes(): Promise<Bar[]> {
      const url = endpointUrl(baseUrl, endpoints?.quotes ?? "quotes");
      try {
        const response = await fetchWithRetry(url, maxAttempts, baseDelayMs);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const body = (await response.json()) as unknown;
        if (!Array.isArray(body)) {
          throw new Error("Invalid quotes response: expected an array");
        }
        const result = normalizeQuotes(body);
        if (staleCache) tryStaleCacheWrite(url, body);
        return result;
      } catch (error) {
        if (staleCache) {
          const cached = tryStaleCacheRead<unknown[]>(url);
          if (cached) {
            onStale?.("quotes");
            return normalizeQuotes(cached);
          }
        }
        onError?.("Error fetching quotes", error);
        throw error;
      }
    },

    async getListings(): Promise<IndicatorListing[]> {
      const url = endpointUrl(baseUrl, endpoints?.indicators ?? "indicators");
      try {
        const response = await fetchWithRetry(url, maxAttempts, baseDelayMs);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = (await response.json()) as IndicatorListing[];
        const result = normalizeListings(data);
        if (staleCache) tryStaleCacheWrite(url, data);
        return result;
      } catch (error) {
        if (staleCache) {
          const cached = tryStaleCacheRead<IndicatorListing[]>(url);
          if (cached) {
            onStale?.("listings");
            return normalizeListings(cached);
          }
        }
        onError?.("Error fetching listings", error);
        throw error;
      }
    },

    async getSelectionData(
      selection: IndicatorSelection,
      listing: IndicatorListing
    ): Promise<IndicatorDataRow[]> {
      const selectionEndpoint = new URL(listing.endpoint, baseUrl);
      selection.params.forEach((p: IndicatorParam) => {
        if (p.value != null) {
          selectionEndpoint.searchParams.set(p.paramName, String(p.value));
        }
      });

      const url = selectionEndpoint.toString();

      try {
        const response = await fetchWithRetry(url, maxAttempts, baseDelayMs);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const body = (await response.json()) as unknown;
        if (!Array.isArray(body)) {
          throw new Error("Invalid selection data response: expected an array");
        }
        const result = body as IndicatorDataRow[];
        if (staleCache) tryStaleCacheWrite(url, result);
        return result;
      } catch (error) {
        if (staleCache) {
          const cached = tryStaleCacheRead<IndicatorDataRow[]>(url);
          if (cached) {
            onStale?.("selection data");
            return cached;
          }
        }
        onError?.("Error fetching selection data", error);
        throw error;
      }
    }
  };
}
