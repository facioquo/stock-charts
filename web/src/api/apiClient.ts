import { createApiClient } from "@facioquo/indy-charts";
import type {
  IndicatorListing,
  IndicatorParam,
  IndicatorSelection,
  Bar
} from "@facioquo/indy-charts";

import { env } from "../config/env";

/** Where the committed snapshot is served; `pnpm run generate:offline-snapshot` writes it. */
export const SNAPSHOT_URL = "/data/chart-api";

/** Error carrying an HTTP-ish status; `0` denotes a network/transport failure. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly url: string,
    /** Raw response body text, when present (e.g. a validation message). */
    readonly body?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** A selection and the catalog entry that defines how to request it. */
export interface SelectionRequest {
  selection: IndicatorSelection;
  listing: IndicatorListing;
}

/** One entry of a `GET /indicators/batch` response. */
interface BatchItem {
  /** The `s` value this item answers; absent from servers that answer strictly in request order. */
  selection?: string;
  status: number;
  data?: unknown;
  error?: string;
}

/**
 * Human-readable message for an API failure. Prefers the server-provided
 * response body (e.g. an indicator parameter validation message) and falls back
 * to the error message. Used by the indicator picker to surface validation
 * errors returned by the .NET Web API.
 */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) return error.body ?? error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}

/** Most selections per batch request; matches the API's cap. */
export const BATCH_SIZE = 20;

/** Statuses meaning the backend will not answer a batch request, now or at this size. */
export const BATCH_REFUSED: ReadonlySet<number> = new Set([400, 404, 405, 413, 414]);

/**
 * Fetch-based client for the .NET Web API. When the API cannot answer, quotes,
 * listings, and indicator rows come from the snapshot served at {@link SNAPSHOT_URL}
 * and `isBackupActive` turns on, so the page can say it is showing saved data.
 *
 * A transient failure of one indicator while quotes and listings are live returns
 * `[]`, which renders as gaps against the live candles.
 */
export class ApiClient {
  private backupActive = false;
  /** Cleared when the backend refuses the batch route. */
  private batchSupported = true;
  /** Reads the live API, then the snapshot; the snapshot answering turns on backup mode. */
  private readonly snapshotClient = createApiClient({
    baseUrl: env.api,
    retry: { maxAttempts: 2, baseDelayMs: 250 },
    offlineFallback: { baseUrl: SNAPSHOT_URL },
    onOffline: context => {
      this.backupActive = true;
      console.warn(`Backend API unavailable, using the offline snapshot for ${context}`);
    }
  });

  /** Whether the API has fallen back to the offline snapshot. */
  get isBackupActive(): boolean {
    return this.backupActive;
  }

  async getQuotes(): Promise<Bar[]> {
    this.backupActive = false;
    return this.snapshotClient.getQuotes();
  }

  async getListings(): Promise<IndicatorListing[]> {
    this.backupActive = false;
    return this.snapshotClient.getListings();
  }

  async getSelectionData(
    selection: IndicatorSelection,
    listing: IndicatorListing
  ): Promise<unknown[]> {
    // Quotes or listings came from the snapshot, so rows must too: live rows would
    // carry current dates against snapshot candles.
    if (this.backupActive) {
      try {
        return await this.snapshotClient.getSelectionData(selection, listing);
      } catch {
        console.warn("No snapshot rows for indicator", { uiid: selection.uiid });
        return [];
      }
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
      // Quotes and listings are live, so the candles are at live timestamps;
      // an empty array renders as gaps beside the other live datasets.
      console.warn("Backend API unavailable, using empty data for indicator", {
        uiid: selection.uiid,
        status: error instanceof ApiError ? error.status : 0
      });
      return [];
    }
  }

  /**
   * Rows for several selections from one `GET /indicators/batch` call (at most
   * 20 per call), as one promise per request in request order. On success every
   * promise settles together, once the batch answers. Items are matched to requests
   * by the `selection` each echoes, so a reordered response cannot hand a chart
   * another indicator's rows; a server that echoes nothing is read positionally.
   * A selection the batch cannot answer (an older backend without the route, a
   * failed item, or an unreadable response) is fetched on its own through
   * {@link getSelectionData}, so the result matches calling that method per selection.
   */
  getSelectionsData(requests: readonly SelectionRequest[]): Array<Promise<unknown[]>> {
    if (requests.length < 2 || this.backupActive || !this.batchSupported) {
      return requests.map(({ selection, listing }) => this.getSelectionData(selection, listing));
    }

    // One request per chunk, so a list longer than the server's cap still batches.
    const chunks: Array<Promise<Array<BatchItem | undefined> | undefined>> = [];
    for (let start = 0; start < requests.length; start += BATCH_SIZE) {
      const chunk = requests.slice(start, start + BATCH_SIZE);
      chunks.push(this.fetchBatch(chunk));
    }

    return requests.map(async ({ selection, listing }, index) => {
      const chunk = chunks.at(Math.floor(index / BATCH_SIZE));
      const item = (await chunk)?.at(index % BATCH_SIZE);
      if (item?.status === 200 && Array.isArray(item.data)) return item.data as unknown[];
      return this.getSelectionData(selection, listing);
    });
  }

  // HELPERS

  /** The `s` value naming one request: its route relative to the API base, then its query. */
  private selectionKey({ selection, listing }: SelectionRequest): string {
    const params = new URLSearchParams();
    selection.params.forEach((p: IndicatorParam) => {
      params.set(p.paramName, String(p.value));
    });
    const url = new URL(this.buildApiUrl(listing.endpoint, params));
    const base = new URL(env.api.endsWith("/") ? env.api : `${env.api}/`);
    const name = url.pathname.startsWith(base.pathname)
      ? url.pathname.slice(base.pathname.length)
      : url.pathname;
    return `${name.replace(/^\/+|\/+$/g, "")}${url.search}`;
  }

  /**
   * One slot per request, in request order; `undefined` marks a request the batch
   * did not answer, and an `undefined` result means the batch could not be used.
   * Callers fall back per selection for either.
   */
  private async fetchBatch(
    requests: readonly SelectionRequest[]
  ): Promise<Array<BatchItem | undefined> | undefined> {
    const keys = requests.map(request => this.selectionKey(request));
    const query = new URLSearchParams();
    keys.forEach(key => {
      query.append("s", key);
    });

    try {
      const batchUrl = new URL("indicators/batch", env.api.endsWith("/") ? env.api : `${env.api}/`);
      batchUrl.search = query.toString();
      const body = await this.getJson<unknown>(batchUrl.toString());
      if (!Array.isArray(body) || body.length !== requests.length) return undefined;
      const items = body as BatchItem[];
      // Echoed selections win over position: the order a response arrives in is not
      // guaranteed, the selection it answers is. A response that echoes nothing is
      // read in request order; one that echoes only some items answers just those.
      if (!items.some(item => typeof item.selection === "string")) return items;
      const bySelection = new Map<string, BatchItem>();
      items.forEach(item => {
        const key = typeof item.selection === "string" ? item.selection.toLowerCase() : undefined;
        if (key !== undefined && !bySelection.has(key)) bySelection.set(key, item);
      });
      return keys.map(key => bySelection.get(key.toLowerCase()));
    } catch (error) {
      // 404/405: the backend predates the route. 400/413/414: it refuses a request this
      // size. Either way a retry would fail the same, so stop asking this session.
      if (error instanceof ApiError && BATCH_REFUSED.has(error.status)) {
        this.batchSupported = false;
      }
      return undefined;
    }
  }

  private async getJson<T>(url: string): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, { headers: { Accept: "application/json" } });
    } catch (cause) {
      // Network/transport failure — model as status 0.
      throw new ApiError(cause instanceof Error ? cause.message : "Network error", 0, url);
    }
    if (!response.ok) {
      let body: string | undefined;
      try {
        body = (await response.text())?.trim() || undefined;
      } catch {
        // Body may be unreadable (already consumed, or test stub without text()).
        body = undefined;
      }
      throw new ApiError(`Request failed: ${response.status}`, response.status, url, body);
    }
    return (await response.json()) as T;
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
}

/** Shared singleton. */
export const apiClient = new ApiClient();
