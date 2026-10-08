import {
  type IndicatorDataRow,
  type IndicatorListing,
  type IndicatorParam,
  type IndicatorResultConfig,
  type IndicatorSelection,
  type Bar
} from "../config/types";
import { fetchOfflineSnapshot } from "./offline";

// ---------------------------------------------------------------------------
// Retry helpers
// ---------------------------------------------------------------------------

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 500;
/**
 * Upper bound applied to any retry delay — both the exponential back-off window
 * and a server-supplied `Retry-After` value — so a high `maxAttempts`/`baseDelayMs`
 * combination or a large/misconfigured header cannot pin a browser tab for an
 * extended period.
 */
const MAX_RETRY_DELAY_MS = 30_000;
const STALE_CACHE_PREFIX = "indy-charts:stale:";

/** One entry of a batch response; `selection` is absent from servers that answer strictly in request order. */
interface BatchItem {
  selection?: string;
  status: number;
  data?: unknown;
}

/** Most selections per batch request; matches the API cap. */
export const BATCH_SIZE = 20;

/** Statuses meaning the server will not answer a batch request at this size, so asking again fails the same. */
export const BATCH_REFUSED: ReadonlySet<number> = new Set([400, 404, 405, 413, 414]);

function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Computes exponential back-off delay with full jitter (AWS Architecture Blog recommendation).
 * The exponential window is capped at {@link MAX_RETRY_DELAY_MS} so deep retry
 * counts cannot produce an unbounded wait.
 * @param retryIndex - Zero-based retry index (0 on first retry).
 * @param baseDelayMs - Starting delay in milliseconds.
 * @returns Delay in milliseconds: a random value in `[0, min(baseDelayMs × 2^retryIndex, MAX_RETRY_DELAY_MS)]`.
 */
function backoffMs(retryIndex: number, baseDelayMs: number): number {
  const exponential = Math.min(baseDelayMs * Math.pow(2, retryIndex), MAX_RETRY_DELAY_MS);
  return Math.floor(Math.random() * exponential);
}

/**
 * Parses the value of a `Retry-After` HTTP header into milliseconds.
 * Accepts either a delay-in-seconds integer or an HTTP-date string.
 * Returns `null` when the header value cannot be interpreted.
 */
function parseRetryAfterMs(header: string): number | null {
  const seconds = Number(header.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  // HTTP-date (RFC 9110 §10.2.3 IMF-fixdate) form. `Date` parsing of non-ISO
  // formats is implementation-defined, but all major browser engines accept it;
  // an unparseable value simply falls through to the exponential back-off path.
  const date = new Date(header.trim());
  if (!Number.isNaN(date.getTime())) {
    const ms = date.getTime() - Date.now();
    return ms > 0 ? ms : 0;
  }
  return null;
}

/**
 * Wraps `fetch` with exponential back-off retry for transient failures.
 *
 * - Retries on network errors (fetch rejection), `5xx`, and `429`.
 * - Respects the `Retry-After` response header on `429`.
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
    let delayMs: number | null = null;
    try {
      const response = await fetch(url);
      if (response.ok || !isTransientStatus(response.status) || isLast) {
        return response;
      }
      // transient HTTP error on a non-final attempt — honour Retry-After if present,
      // clamped to a ceiling so a misconfigured origin can't stall the client.
      const retryAfter = response.headers.get("Retry-After");
      if (retryAfter !== null) {
        const parsed = parseRetryAfterMs(retryAfter);
        delayMs = parsed !== null ? Math.min(parsed, MAX_RETRY_DELAY_MS) : null;
      }
    } catch (networkError) {
      if (isLast) throw networkError;
      // network error on a non-final attempt — retry
    }
    await sleep(delayMs ?? backoffMs(attempt, baseDelayMs));
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
// Shared response memo (module-level, per resolved URL)
// ---------------------------------------------------------------------------

/**
 * One shared fetch of a catalog-style resource (quotes or listings).
 * `body` is the parsed JSON of a successful (`2xx`) response.
 */
interface SharedResponse {
  body: Promise<unknown>;
  /** Whether a staleCache-enabled caller has already persisted this body. */
  staleWritten: boolean;
}

/**
 * Successful quote and listing responses are shared by every client created in
 * this module, keyed by the fully resolved request URL. Concurrent callers join
 * one in-flight request, and later callers reuse the settled body for the
 * page's lifetime. A failed request is evicted so the next call refetches.
 * Settled bodies are kept deliberately: sizing layouts from listings at mount
 * needs a synchronous read, and `clearApiClientCache()` is the refresh path.
 * The URL is the whole key because `fetchWithRetry` sends a bare `fetch(url)`;
 * any header or fetch option added later must join it.
 */
const sharedResponses = new Map<string, SharedResponse>();

/** Settled bodies from {@link sharedResponses}, readable synchronously. */
const settledBodies = new Map<string, unknown>();

function evictShared(url: string, entry: SharedResponse): void {
  if (sharedResponses.get(url) === entry) {
    sharedResponses.delete(url);
    settledBodies.delete(url);
  }
}

/**
 * Returns the shared response for `url`, starting a fetch only when no request
 * for that URL is in flight or settled. The first caller's retry policy applies
 * to the shared request.
 */
function fetchShared(url: string, maxAttempts: number, baseDelayMs: number): SharedResponse {
  const existing = sharedResponses.get(url);
  if (existing) return existing;

  const body = (async (): Promise<unknown> => {
    const response = await fetchWithRetry(url, maxAttempts, baseDelayMs);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return (await response.json()) as unknown;
  })();

  const entry: SharedResponse = { body, staleWritten: false };
  sharedResponses.set(url, entry);
  body.then(
    value => {
      if (sharedResponses.get(url) === entry) settledBodies.set(url, value);
    },
    () => evictShared(url, entry)
  );
  return entry;
}

/**
 * Clears the quote and listing responses shared across every
 * {@link createApiClient} instance, so the next `getQuotes()` or
 * `getListings()` call fetches again. The `sessionStorage` stale cache is
 * left untouched.
 */
export function clearApiClientCache(): void {
  sharedResponses.clear();
  settledBodies.clear();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

/**
 * Synchronously returns indicator listings already known for this API without
 * making a request: a settled shared response first, then (when `staleCache`
 * is enabled) the last-good `sessionStorage` copy. Returns `undefined` when
 * neither is available. Used to size chart layouts before data arrives.
 */
export function peekCachedListings(
  config: Pick<ApiClientConfig, "baseUrl" | "endpoints" | "staleCache">
): IndicatorListing[] | undefined {
  const url = listingsRequestUrl(config);
  const candidates: unknown[] = [settledBodies.get(url)];
  if (config.staleCache) candidates.push(tryStaleCacheRead<unknown>(url));

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    try {
      return normalizeListings(candidate as IndicatorListing[]);
    } catch {
      // Malformed entry — try the next source.
    }
  }
  return undefined;
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
   * Actual delay for retry `n` ≈ random value in `[0, baseDelayMs × 2^(n−1)]` (full jitter),
   * with the window capped at 30 seconds so deep retry counts stay bounded.
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
    /** Defaults to `indicators/batch`. */
    batch?: string;
  };

  /**
   * Optional error callback invoked whenever a fetch operation throws or
   * receives a non-2xx response.  When `staleCache` is enabled and a cached
   * value is available the error is **not** re-thrown (the promise resolves
   * with stale data); otherwise the error is **re-thrown** after the callback
   * returns, so callers still need to handle it.
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

  /**
   * Static snapshot served by the consumer's own site. When a live request and
   * the {@link staleCache} both come up empty, the client reads the matching
   * file under `baseUrl` instead, so charts still render when the API is gone
   * for good. Produce the files with {@link createOfflineSnapshot}.
   *
   * Resolution order: live request (with retry), then `staleCache`, then this
   * snapshot, then the original error. A missing or unreachable snapshot file
   * is ignored, so the fallback is safe during server-side rendering.
   */
  offlineFallback?: {
    /** Root URL of the snapshot files, e.g. `"/data/chart-api"`. */
    baseUrl: string;
  };

  /**
   * Called when snapshot data is returned because the live request failed.
   * Distinct from {@link onStale}, which reports the per-tab `sessionStorage` copy.
   *
   * @param context - Human-readable description of the operation served from
   *                  the snapshot (e.g. `"quotes"`, `"listings"`, `"selection data"`).
   */
  onOffline?: (context: string) => void;
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
   * @throws  Re-throws any network or HTTP error (after calling `onError`) unless
   *          stale cached data or an offline snapshot copy is available.
   *
   * Successful responses are shared, per resolved URL, by every client this
   * package creates: concurrent calls join one request and later calls reuse
   * its body until {@link clearApiClientCache} is called.
   */
  getQuotes(): Promise<Bar[]>;

  /**
   * Fetches all available indicator listings from `GET /indicators`.
   *
   * @returns Resolved array of {@link IndicatorListing} descriptors.
   * @throws  Re-throws any network or HTTP error (after calling `onError`) unless
   *          stale cached data or an offline snapshot copy is available.
   *
   * Successful responses are shared, per resolved URL, by every client this
   * package creates: concurrent calls join one request and later calls reuse
   * its body until {@link clearApiClientCache} is called.
   */
  getListings(): Promise<IndicatorListing[]>;

  /**
   * Fetches computed indicator data for the given selection and listing.
   * Query-string parameters are derived from {@link IndicatorSelection.params}.
   *
   * @param selection - The user's current indicator parameter choices.
   * @param listing   - The indicator descriptor that provides the endpoint path.
   * @returns Resolved array of raw data rows for the indicator series.
   * @throws  Re-throws any network or HTTP error (after calling `onError`) unless
   *          stale cached data or an offline snapshot copy is available.
   */
  getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): Promise<IndicatorDataRow[]>;

  /**
   * Rows for several selections from one `GET indicators/batch` request, as one
   * promise per request in request order. A selection the batch cannot answer
   * (a server without the route, a failed item, or an unreadable response) is
   * requested on its own through {@link getSelectionData}, so each promise
   * settles as that method would. At most 20 selections go in one request. A
   * server that answers `404`, `405`, `400`, `413` or `414` is not asked for the
   * batch again. On success every promise settles together, once the batch
   * answers, so a chart cannot draw before its neighbours' rows arrive.
   *
   * @param requests - Selections with the listings that define their endpoints.
   */
  getSelectionsData(
    requests: ReadonlyArray<{ selection: IndicatorSelection; listing: IndicatorListing }>
  ): Array<Promise<IndicatorDataRow[]>>;
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

type UrlConfig = Pick<ApiClientConfig, "baseUrl" | "endpoints">;

/** Resolved `GET /quotes` URL for a client config. Shared with the snapshot generator. */
export function quotesRequestUrl(config: UrlConfig): string {
  return endpointUrl(normalizeBaseUrl(config.baseUrl), config.endpoints?.quotes ?? "quotes");
}

/** Resolved `GET /indicators` URL for a client config. Shared with the snapshot generator. */
export function listingsRequestUrl(config: UrlConfig): string {
  return endpointUrl(
    normalizeBaseUrl(config.baseUrl),
    config.endpoints?.indicators ?? "indicators"
  );
}

/** Resolved indicator data URL, with the selection's parameters as the query. */
export function selectionRequestUrl(
  config: UrlConfig,
  selection: IndicatorSelection,
  listing: IndicatorListing
): string {
  const url = new URL(listing.endpoint, normalizeBaseUrl(config.baseUrl));
  selection.params.forEach((p: IndicatorParam) => {
    if (p.value != null) {
      url.searchParams.set(p.paramName, String(p.value));
    }
  });
  return url.toString();
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
  const { onError, staleCache, onStale, offlineFallback, onOffline } = config;
  // Ensure baseUrl always ends with "/" so new URL(path, base) resolves correctly.
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  const retryEnabled = config.retry !== false;
  const rawMaxAttempts = retryEnabled
    ? ((config.retry as RetryConfig | undefined)?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)
    : 1;
  // Guard against Infinity or non-positive values which would produce an infinite loop.
  const maxAttempts =
    retryEnabled && (!Number.isFinite(rawMaxAttempts) || rawMaxAttempts < 1)
      ? DEFAULT_MAX_ATTEMPTS
      : rawMaxAttempts;
  const baseDelayMs = retryEnabled
    ? ((config.retry as RetryConfig | undefined)?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS)
    : 0;

  /** Reads the snapshot copy of `url`, validated by `parse`; `undefined` when unavailable. */
  async function readOffline<T>(url: string, parse: (body: unknown) => T): Promise<T | undefined> {
    if (!offlineFallback) return undefined;
    const body = await fetchOfflineSnapshot({
      snapshotBaseUrl: offlineFallback.baseUrl,
      apiBaseUrl: baseUrl,
      requestUrl: url
    });
    if (body === undefined) return undefined;
    try {
      return parse(body);
    } catch {
      return undefined;
    }
  }

  let batchSupported = true;

  /**
   * One slot per request, in request order; `undefined` marks a request the batch did
   * not answer, and an `undefined` result means the batch could not be used. Callers
   * fall back per selection for either.
   */
  async function fetchBatch(
    requests: ReadonlyArray<{ selection: IndicatorSelection; listing: IndicatorListing }>
  ): Promise<Array<BatchItem | undefined> | undefined> {
    const keys: string[] = [];
    const base = new URL(baseUrl);
    const url = new URL(config.endpoints?.batch ?? "indicators/batch", baseUrl);
    for (const { selection, listing } of requests) {
      const request = new URL(selectionRequestUrl(config, selection, listing));
      const name = request.pathname.startsWith(base.pathname)
        ? request.pathname.slice(base.pathname.length)
        : request.pathname;
      const key = `${name.replace(/^\/+|\/+$/g, "")}${request.search}`;
      keys.push(key);
      url.searchParams.append("s", key);
    }

    try {
      // One attempt: each selection has its own retrying request to fall back to.
      const response = await fetchWithRetry(url.toString(), 1, baseDelayMs);
      if (BATCH_REFUSED.has(response.status)) batchSupported = false;
      if (!response.ok) return undefined;
      const body = (await response.json()) as unknown;
      if (!Array.isArray(body) || body.length !== requests.length) return undefined;
      const items = body as BatchItem[];
      // Echoed selections win over position: the order a response arrives in is not
      // guaranteed, the selection it answers is. A response that echoes nothing is
      // read in request order; one that echoes only some items answers just those.
      if (!items.some(item => typeof item.selection === "string")) return items;
      const bySelection = new Map<string, BatchItem>();
      for (const item of items) {
        const key = typeof item.selection === "string" ? item.selection.toLowerCase() : undefined;
        if (key !== undefined && !bySelection.has(key)) bySelection.set(key, item);
      }
      return keys.map(key => bySelection.get(key.toLowerCase()));
    } catch {
      return undefined;
    }
  }

  const client: ApiClient = {
    async getQuotes(): Promise<Bar[]> {
      const url = quotesRequestUrl(config);
      const shared = fetchShared(url, maxAttempts, baseDelayMs);
      try {
        const body = await shared.body;
        if (!Array.isArray(body)) {
          throw new Error("Invalid quotes response: expected an array");
        }
        const result = normalizeQuotes(body);
        if (staleCache && !shared.staleWritten) {
          tryStaleCacheWrite(url, body);
          shared.staleWritten = true;
        }
        return result;
      } catch (error) {
        // Never keep a body that failed validation; the next call refetches.
        evictShared(url, shared);
        if (staleCache) {
          const cached = tryStaleCacheRead<unknown[]>(url);
          // Guard against a tampered or corrupted cache entry before normalizing.
          if (Array.isArray(cached)) {
            try {
              const staleData = normalizeQuotes(cached);
              onError?.("Error fetching quotes", error);
              onStale?.("quotes");
              return staleData;
            } catch {
              // Malformed cached data — fall through to surface original fetch error.
            }
          }
        }
        const snapshot = await readOffline(url, body => {
          if (!Array.isArray(body)) throw new Error("expected an array");
          return normalizeQuotes(body);
        });
        if (snapshot) {
          onError?.("Error fetching quotes", error);
          onOffline?.("quotes");
          return snapshot;
        }
        onError?.("Error fetching quotes", error);
        throw error;
      }
    },

    async getListings(): Promise<IndicatorListing[]> {
      const url = listingsRequestUrl(config);
      const shared = fetchShared(url, maxAttempts, baseDelayMs);
      try {
        const data = (await shared.body) as IndicatorListing[];
        const result = normalizeListings(data);
        if (staleCache && !shared.staleWritten) {
          tryStaleCacheWrite(url, data);
          shared.staleWritten = true;
        }
        return result;
      } catch (error) {
        // Never keep a body that failed validation; the next call refetches.
        evictShared(url, shared);
        if (staleCache) {
          const cached = tryStaleCacheRead<IndicatorListing[]>(url);
          // Guard against a tampered or corrupted cache entry before normalizing.
          if (Array.isArray(cached)) {
            try {
              const staleData = normalizeListings(cached);
              onError?.("Error fetching listings", error);
              onStale?.("listings");
              return staleData;
            } catch {
              // Malformed cached data — fall through to surface original fetch error.
            }
          }
        }
        const snapshot = await readOffline(url, body => {
          if (!Array.isArray(body)) throw new Error("expected an array");
          return normalizeListings(body as IndicatorListing[]);
        });
        if (snapshot) {
          onError?.("Error fetching listings", error);
          onOffline?.("listings");
          return snapshot;
        }
        onError?.("Error fetching listings", error);
        throw error;
      }
    },

    async getSelectionData(
      selection: IndicatorSelection,
      listing: IndicatorListing
    ): Promise<IndicatorDataRow[]> {
      const url = selectionRequestUrl(config, selection, listing);

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
          // Guard against a tampered or corrupted cache entry, mirroring the live path.
          if (Array.isArray(cached)) {
            onError?.("Error fetching selection data", error);
            onStale?.("selection data");
            return cached;
          }
        }
        const snapshot = await readOffline(url, body => {
          if (!Array.isArray(body)) throw new Error("expected an array");
          return body as IndicatorDataRow[];
        });
        if (snapshot) {
          onError?.("Error fetching selection data", error);
          onOffline?.("selection data");
          return snapshot;
        }
        onError?.("Error fetching selection data", error);
        throw error;
      }
    },

    getSelectionsData(requests) {
      if (requests.length < 2 || !batchSupported) {
        return requests.map(({ selection, listing }) =>
          client.getSelectionData(selection, listing)
        );
      }

      // One request per chunk, so a list longer than the server's cap still batches.
      const chunks: Array<Promise<Array<BatchItem | undefined> | undefined>> = [];
      for (let start = 0; start < requests.length; start += BATCH_SIZE) {
        chunks.push(fetchBatch(requests.slice(start, start + BATCH_SIZE)));
      }

      return requests.map(async ({ selection, listing }, index) => {
        const item = (await chunks.at(Math.floor(index / BATCH_SIZE)))?.at(index % BATCH_SIZE);
        if (item?.status === 200 && Array.isArray(item.data)) {
          const rows = item.data as IndicatorDataRow[];
          if (staleCache) tryStaleCacheWrite(selectionRequestUrl(config, selection, listing), rows);
          return rows;
        }
        return client.getSelectionData(selection, listing);
      });
    }
  };

  return client;
}
