# API client

`createApiClient()` returns a small, typed wrapper around `fetch` that knows how to talk to the stock-charts REST API. It does not own any chart state — it only fetches and normalizes data.

## Create a client

```typescript
import { createApiClient } from "@facioquo/indy-charts";

const client = createApiClient({
  baseUrl: "https://api.example.com",
  onError: (context, error) => console.error(`[indy-charts] ${context}`, error)
});
```

The `baseUrl` may include or omit a trailing slash — the client normalizes it.

## `ApiClientConfig`

```typescript
interface ApiClientConfig {
  /** Root URL of the API. Trailing slash is optional. */
  baseUrl: string;

  /** Optional endpoint path overrides (when the API mounts routes elsewhere). */
  endpoints?: {
    quotes?: string;       // default: "quotes"
    indicators?: string;   // default: "indicators"
  };

  /**
   * Called whenever a fetch operation throws or receives a non-2xx response.
   * When staleCache is enabled and a cached value is available, the promise
   * resolves with stale data after onError fires — it is not re-thrown.
   * Otherwise the error is re-thrown after the callback returns — callers
   * must still handle the rejected promise.
   */
  onError?: (context: string, error: unknown) => void;

  /**
   * Retry policy for transient failures — network errors, 5xx, and 429.
   * Set to `false` to disable all retries.
   * Defaults to { maxAttempts: 3, baseDelayMs: 500 }.
   */
  retry?: RetryConfig | false;

  /**
   * When true, each successful response is stored in sessionStorage (browser only).
   * If all retries fail the last stored value is returned and onStale is called.
   * Defaults to false.
   */
  staleCache?: boolean;

  /**
   * Called when stale cached data is served because the live request failed.
   * @param context - e.g. "quotes", "listings", "selection data"
   */
  onStale?: (context: string) => void;

  /**
   * Static snapshot served by your own site, read when the live request and the
   * stale cache both fail. Produce the files with createOfflineSnapshot().
   */
  offlineFallback?: { baseUrl: string };

  /**
   * Called when snapshot data is served because the live request failed.
   * @param context - e.g. "quotes", "listings", "selection data"
   */
  onOffline?: (context: string) => void;
}

interface RetryConfig {
  /** Maximum total attempts (1 = no retries). Defaults to 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds for exponential back-off. Defaults to 500. */
  baseDelayMs?: number;
}
```

## Resilience options

### Automatic retry

By default the client retries up to **3 times** with exponential back-off and full jitter (starting at 500 ms) for transient failures: network errors, `5xx` responses, and `429`. Non-transient `4xx` errors (except `429`) are not retried. Both the back-off window and a server-supplied `Retry-After` header are capped at a 30-second ceiling, so neither a high `maxAttempts`/`baseDelayMs` combination nor a misconfigured origin can stall the client. On `429`, a `Retry-After` header is honoured in place of the computed back-off.

```typescript
// Custom retry — more aggressive
const client = createApiClient({
  baseUrl: "https://api.example.com",
  retry: { maxAttempts: 5, baseDelayMs: 200 }
});

// Disable retries entirely
const client = createApiClient({
  baseUrl: "https://api.example.com",
  retry: false
});
```

### Stale cache fallback

When `staleCache: true`, each successful response is persisted in `sessionStorage`. If the API is momentarily unavailable and all retries fail, the last cached response is returned and `onStale` is called so the UI can display a "stale data" indicator.

```typescript
const client = createApiClient({
  baseUrl: "https://api.example.com",
  staleCache: true,
  onStale: (context) => {
    console.warn(`Serving stale ${context} — API unreachable`);
    // e.g. show a "data may be outdated" banner
  }
});
```

Quote and listing responses are shared across every client (see [Methods](#methods)). A call answered from a settled response never reaches the fallback; a fetch that goes out still does, including the page's first fetch after a reload, a fetch after a failure, and one after `clearApiClientCache()`.

`sessionStorage` is guarded: if it is unavailable (server-side rendering, private browsing, quota exceeded) the cache is silently skipped and the live-fetch error is surfaced normally.

### Offline snapshot fallback

The stale cache is per tab and empty for a first-time visitor, so it cannot cover an origin that is gone for good. `offlineFallback` reads a snapshot shipped with your own site instead. The order is the live request (with retry), then `staleCache`, then the snapshot, then the original error. `onOffline` fires when snapshot data is served, and `onError` still fires for the failed live request. Each call waits out the live retries before the snapshot is read and the snapshot is not remembered, so pair `offlineFallback` with `retry: false` or a low `maxAttempts` for an origin that is gone. Snapshot files match the package version that wrote them; regenerate them when upgrading.

Build the snapshot at build time, while the API is reachable. `createOfflineSnapshot` returns the files at the paths the fallback reads, so the two cannot drift:

```typescript
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createOfflineSnapshot } from "@facioquo/indy-charts";

const files = await createOfflineSnapshot({ baseUrl: "https://api.example.com" });
for (const { path, data } of files) {
  const target = join("public/chart-api", path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(data));
}
```

```typescript
const client = createApiClient({
  baseUrl: "https://api.example.com",
  offlineFallback: { baseUrl: "/chart-api" },
  onOffline: context => console.warn(`Serving ${context} from the offline snapshot`)
});
```

By default the snapshot holds the quotes, the indicator listings, and one data file per catalog indicator at its default parameters. Pass `{ selections }` to also capture parameters a page uses that differ from the defaults. A request with other parameters has no file and fails as it would without a snapshot.

Each request maps to one file under the snapshot root. The API base path is dropped, so the layout does not depend on where the API is mounted:

| Request | File |
| --- | --- |
| `GET /quotes` | `quotes.json` |
| `GET /indicators` | `indicators.json` |
| `GET /SMA/` | `SMA.json` |
| `GET /SMA/?lookbackPeriods=20` | `SMA/lookbackPeriods=20.json` |

Parameters are sorted by name and percent-encoded. A missing or unreachable snapshot file is ignored, so the fallback is safe during server-side rendering.

## Methods

The returned `ApiClient` exposes three methods. All return promises that reject (after `onError`) on network or HTTP failures, unless `staleCache` holds a prior response or `offlineFallback` has a snapshot file — in that case `onError` still fires but the promise resolves with that data.

Successful `getQuotes()` and `getListings()` responses are shared, per resolved URL, by every client the package creates. Concurrent calls join one request, and later calls reuse the settled body for the page's lifetime. A failed request is not kept. Call `clearApiClientCache()` to force a refetch; do this before refreshing in a long-lived tab, an interval, or a Node or SSR process. The first caller's retry settings govern a shared request.

```typescript
import { clearApiClientCache } from "@facioquo/indy-charts";

clearApiClientCache();
const fresh = await client.getQuotes();
```

### `getQuotes(): Promise<Bar[]>`

Fetches OHLCV history from `GET {baseUrl}/quotes` and normalizes the response into `Bar` objects (timestamps parsed to `Date`).

```typescript
const quotes = await client.getQuotes();
```

### `getListings(): Promise<IndicatorListing[]>`

Fetches the indicator catalog from `GET {baseUrl}/indicators`. Each listing describes one indicator (uiid, parameters, default colors, oscillator/overlay type).

```typescript
const listings = await client.getListings();
const ema = listings.find(l => l.uiid === "EMA");
```

### `getSelectionData(selection, listing): Promise<unknown[]>`

Fetches computed indicator rows. The endpoint path comes from `listing.endpoint`; query-string parameters are derived from `selection.params`.

```typescript
import { createDefaultSelection, loadStaticIndicatorData } from "@facioquo/indy-charts";

const selection = createDefaultSelection(emaListing, { lookbackPeriods: 20 });
const rawRows = await client.getSelectionData(selection, emaListing);
const rows = loadStaticIndicatorData(rawRows);
```

Wrap the result in `loadStaticIndicatorData()` to get a typed `IndicatorDataRow[]`.

## Data shape

After normalization, quote data conforms to:

```typescript
interface Bar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

Invalid timestamps (missing, non-string/Date, or `NaN` after parsing) cause `getQuotes()` to throw an `Error` with the row index.

## Error handling

```typescript
const client = createApiClient({
  baseUrl: "https://api.example.com",
  onError: (context, error) => {
    // Surface the error to your logging/telemetry layer.
    console.error(`[indy-charts] ${context}`, error);
  }
});

try {
  const quotes = await client.getQuotes();
} catch (err) {
  // onError already fired — handle the failure (fallback, retry, UI state).
}
```

`onError` is **observational**, not recovery. Without a fallback, the promise still rejects with the original error so callers can decide how to react. With `staleCache` and a cache hit, `onError` fires but the promise resolves — the caller receives stale data and `onStale` is also called. With `offlineFallback` and a snapshot file, it resolves the same way and `onOffline` is called.

## Custom endpoint paths

If your deployment mounts the API under a non-default route:

```typescript
const client = createApiClient({
  baseUrl: "https://api.example.com",
  endpoints: {
    quotes: "v2/market/quotes",
    indicators: "v2/market/indicators"
  }
});
```

`getSelectionData` always uses `listing.endpoint`, so per-indicator routes come from the listings response — no client-side override needed.

## Next steps

- [Overlay chart example](/examples/) — see the client in action
- [Oscillator example](/examples/indicators) — paired and standalone
- [Custom data](/examples/custom-data) — skip the API entirely
