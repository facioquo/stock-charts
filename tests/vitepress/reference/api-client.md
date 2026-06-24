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
   * The error is re-thrown after the callback returns — callers must still
   * handle the rejected promise.
   */
  onError?: (context: string, error: unknown) => void;
}
```

## Methods

The returned `ApiClient` exposes three methods. All return promises that reject (after `onError`) on network or HTTP failures.

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

`onError` is **observational**, not recovery. The promise still rejects with the original error so callers can decide how to react.

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
